const Store = require('./store')

// 生成 6 位随机邀请码 (大写字母+数字)
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

class AuthManager {
  constructor() {
    this.currentUser = null
    this.isGuest = true
    this.syncQueue = []
    this.isSyncing = false
  }

  // 初始化：检查本地存储是否有用户信息
  async init() {
    const store = Store.get()
    if (store.user && store.user._id) {
      this.currentUser = store.user
      this.isGuest = false
      // 尝试静默登录
      await this.silentLogin()
    }
    return this.getUser()
  }

  // 微信授权登录
  async wxLogin() {
    try {
      // 获取微信登录 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })

      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }

      // 获取用户信息
      const userInfo = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于完善个人资料',
          success: (res) => resolve(res.userInfo),
          fail: reject
        })
      }).catch(() => null)

      // 调用云函数登录
      const cloudResult = await wx.cloud.callFunction({
        name: 'login',
        data: {
          code: loginRes.code,
          userInfo: userInfo,
          inviteCode: this._pendingInviteCode || null
        }
      })

      if (cloudResult.result && cloudResult.result.success) {
        const user = cloudResult.result.data
        this.currentUser = user
        this.isGuest = false

        // 保存到本地
        const store = Store.get()
        store.user = user
        Store.save(store)

        // 清除待处理的邀请码
        this._pendingInviteCode = null

        return { success: true, user }
      } else {
        throw new Error(cloudResult.result?.message || '登录失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 静默登录（已授权用户）
  async silentLogin() {
    if (!this.currentUser || this.isGuest) {
      return { success: false }
    }

    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })

      const cloudResult = await wx.cloud.callFunction({
        name: 'login',
        data: {
          code: loginRes.code,
          silent: true
        }
      })

      if (cloudResult.result && cloudResult.result.success) {
        this.currentUser = cloudResult.result.data
        // 更新本地存储
        const store = Store.get()
        store.user = this.currentUser
        Store.save(store)
        return { success: true }
      }
    } catch (error) {
      console.error('静默登录失败:', error)
    }

    return { success: false }
  }

  // 退出登录
  logout() {
    this.currentUser = null
    this.isGuest = true
    const store = Store.get()
    store.user = null
    Store.save(store)
  }

  // 获取当前用户
  getUser() {
    if (this.currentUser) {
      return {
        ...this.currentUser,
        isGuest: this.isGuest
      }
    }
    return {
      nickname: '微光用户',
      avatarUrl: '',
      isGuest: true
    }
  }

  // 检查是否已登录
  isLoggedIn() {
    return !this.isGuest && this.currentUser !== null
  }

  // 处理通过邀请码进入
  handleInviteCode(inviteCode) {
    if (inviteCode && inviteCode.length === 6) {
      this._pendingInviteCode = inviteCode
      return true
    }
    return false
  }

  // 添加待同步操作
  async enqueueSync(operation) {
    if (!this.isLoggedIn()) {
      // 未登录时仅存本地
      return
    }

    this.syncQueue.push({
      ...operation,
      timestamp: Date.now()
    })

    // 尝试立即同步
    await this.flushSync()
  }

  // 执行同步
  async flushSync() {
    if (this.syncQueue.length === 0 || this.isSyncing || !this.isLoggedIn()) {
      return
    }

    this.isSyncing = true

    try {
      const batch = this.syncQueue.splice(0, 20) // 每次最多同步 20 条
      const result = await wx.cloud.callFunction({
        name: 'syncData',
        data: {
          operations: batch
        }
      })

      if (!result.result || !result.result.success) {
        // 同步失败，放回队列
        this.syncQueue.unshift(...batch)
      }
    } catch (error) {
      console.error('数据同步失败:', error)
      // 同步失败，数据留在队列中
    } finally {
      this.isSyncing = false
    }
  }

  // 获取 LLM 剩余额度
  getRemainingQuota() {
    if (!this.currentUser || !this.currentUser.llmQuota) {
      return 100 // 访客默认额度
    }
    const quota = this.currentUser.llmQuota
    return (quota.base + quota.bonus) - quota.used
  }

  // 消耗额度
  consumeQuota() {
    if (!this.currentUser || !this.currentUser.llmQuota) {
      return false
    }
    if (this.getRemainingQuota() <= 0) {
      return false
    }
    this.currentUser.llmQuota.used++
    return true
  }
}

// 单例导出
const auth = new AuthManager()
module.exports = auth
