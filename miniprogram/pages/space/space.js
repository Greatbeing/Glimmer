const { ApiConfig, QuotaManager } = require('../../utils/quoteService')
const Store = require('../../utils/store')
const auth = require('../../utils/auth')
const checkinManager = require('../../utils/checkin')
const badgeManager = require('../../utils/badges')

// Constants
const API_TIMEOUT = 5000

Page({
  data: {
    isLoggedIn: false,
    user: {},
    activeTab: 'caught',
    caught: [],
    posts: [],
    caughtCount: 0,
    postCount: 0,
    likeCount: 0,
    checkinStreak: 0,
    hasCheckedInToday: false,
    badges: [],
    totalBadges: 0,
    // API Settings
    showSettings: false,
    apiKeyInput: '',
    showKey: false,
    modelOptions: ['通义千问 (qwen-turbo)', '智谱清言 (glm-4)', '文心一言 (ernie-bot)'],
    modelIndex: 0,
    apiUrlInput: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    quotaUsed: 0,
    quotaTotal: 100,
    saving: false
  },

  async onShow() {
    // 更新登录状态
    const user = auth.getUser()
    const isLoggedIn = auth.isLoggedIn()

    // 检查今天是否已签到
    const hasCheckedInToday = checkinManager._getToday() === (Store.get().checkins || []).slice(-1)[0]?.date

    this.setData({
      isLoggedIn,
      user,
      checkinStreak: user.stats?.checkinStreak || 0,
      hasCheckedInToday,
      quotaUsed: user.llmQuota?.used || 0,
      quotaTotal: (user.llmQuota?.base || 100) + (user.llmQuota?.bonus || 0)
    })

    if (isLoggedIn) {
      this.loadData()
      this.loadBadges()
    }
    this.loadApiConfig()
  },

  // 加载徽章
  loadBadges() {
    const user = auth.getUser()
    const stats = user.stats || { catches: 0, posts: 0, likes: 0, invites: 0, checkinStreak: 0 }

    const badges = badgeManager.getUserBadges()
    const totalBadges = badgeManager.getTotalCount()

    this.setData({ badges, totalBadges })
  },

  // 执行签到
  async doCheckin() {
    if (this.data.hasCheckedInToday) {
      wx.showToast({ title: `已连续打卡 ${this.data.checkinStreak} 天`, icon: 'none' })
      return
    }

    // 本地签到
    const result = checkinManager.doCheckin()

    if (result.success) {
      this.setData({
        checkinStreak: result.streak,
        hasCheckedInToday: true
      })

      // 检查并颁发徽章
      const user = auth.getUser()
      const stats = user.stats || {}
      stats.checkinStreak = result.streak
      const newBadges = await badgeManager.checkAndAwardBadges(stats)

      if (newBadges.length > 0) {
        this.loadBadges()
      }

      // 同步到云端
      auth.enqueueSync({
        type: 'checkin',
        data: {
          date: checkinManager._getToday(),
          streak: result.streak,
          reward: result.reward
        }
      })

      wx.showModal({
        title: '签到成功',
        content: result.message,
        showCancel: false
      })
    } else {
      wx.showToast({ title: result.message, icon: 'none' })
    }
  },

  // 微信授权登录
  async handleLogin() {
    wx.showLoading({ title: '登录中...' })

    const result = await auth.wxLogin()

    wx.hideLoading()

    if (result.success) {
      wx.showToast({ title: '登录成功', icon: 'success' })

      // 更新页面状态
      this.setData({
        isLoggedIn: true,
        user: result.user,
        checkinStreak: result.user.stats?.checkinStreak || 0,
        quotaUsed: result.user.llmQuota?.used || 0,
        quotaTotal: (result.user.llmQuota?.base || 100) + (result.user.llmQuota?.bonus || 0)
      })

      // 更新全局数据
      const app = getApp()
      app.globalData.user = result.user

      this.loadData()
    } else {
      wx.showToast({ title: result.error || '登录失败', icon: 'none' })
    }
  },

  // 分享邀请
  shareInvite() {
    const inviteCode = this.data.user.inviteCode
    if (!inviteCode) return

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })

    // 设置分享配置
    this._shareData = {
      title: '邀请你使用 Glimmer 微光',
      path: `/pages/index/index?invite=${inviteCode}`,
      imageUrl: ''
    }

    wx.showToast({ title: '点击右上角分享', icon: 'none' })
  },

  // 复制邀请码
  copyInviteCode() {
    const inviteCode = this.data.user.inviteCode
    if (!inviteCode) return

    wx.setClipboardData({
      data: inviteCode,
      success: () => {
        wx.showToast({ title: '邀请码已复制', icon: 'success' })
      }
    })
  },

  // 显示签到
  showCheckin() {
    wx.showToast({ title: `已连续打卡 ${this.data.checkinStreak} 天`, icon: 'none' })
  },

  // API Settings
  loadApiConfig() {
    const config = ApiConfig.load()
    const quotaUsed = QuotaManager.getUsed()
    
    this.setData({
      modelIndex: config.model === 'glm-4' ? 1 : config.model === 'ernie-bot' ? 2 : 0,
      apiUrlInput: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKeyInput: config.key ? '••••••••' : '',
      quotaUsed
    })
  },

  showApiSettings() {
    this.loadApiConfig()
    this.setData({ showSettings: true })
  },

  hideSettings() {
    this.setData({ showSettings: false })
  },

  onApiKeyInput(e) {
    this.setData({ apiKeyInput: e.detail.value })
  },

  onApiUrlInput(e) {
    this.setData({ apiUrlInput: e.detail.value })
  },

  onModelChange(e) {
    this.setData({ modelIndex: parseInt(e.detail.value) })
  },

  async saveApiConfig() {
    let key = this.data.apiKeyInput.trim()
    const models = ['qwen-turbo', 'glm-4', 'ernie-bot']
    const model = models[this.data.modelIndex]
    const baseUrl = this.data.apiUrlInput.trim()

    if (!key || key.length < 10) {
      wx.showToast({ title: '请输入有效的 API Key', icon: 'none' })
      return
    }

    // If masked, use existing key
    if (key === '••••••••') {
      try { key = ApiConfig.load().key } catch(e) {}
    }

    this.setData({ saving: true })

    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('请求超时')), API_TIMEOUT)
        
        wx.request({
          url: baseUrl + '/chat/completions',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          data: {
            model: model,
            messages: [{ role: 'user', content: '你好' }],
            max_tokens: 10
          },
          success(res) {
            clearTimeout(timer)
            if (res.statusCode === 200) resolve()
            else reject(new Error(res.data?.error?.message || res.statusCode))
          },
          fail(err) { 
            clearTimeout(timer)
            reject(new Error(err.errMsg || '网络错误')) 
          }
        })
      })

      wx.setStorageSync('glimmer_api_setup_done', '1')
      ApiConfig.save({ key, model, baseUrl })
      wx.showToast({ title: '验证成功', icon: 'success' })
      this.setData({ showSettings: false })
    } catch(e) {
      wx.showToast({ title: `验证失败: ${e.message || e.errMsg}`, icon: 'none', duration: 3000 })
    } finally {
      this.setData({ saving: false })
    }
  },

  loadData() {
    const store = Store.get()
    const posts = store.posts.map(p => ({
      ...p,
      timeText: Store.formatTime(p.time),
      liked: Store.isLikedPost(p.id)
    }))

    this.setData({
      caught: Store.getCaught(),
      posts: posts,
      caughtCount: Store.getCaught().length,
      postCount: store.posts.length,
      likeCount: store.posts.reduce((s, p) => s + (p.likes || 0), 0)
    })
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  toggleLike(e) {
    const id = e.currentTarget.dataset.id
    Store.toggleLikePost(id)
    this.loadData()
  },

  removeCaught(e) {
    wx.showModal({
      title: '确定取消捕捉？',
      success: (res) => {
        if (res.confirm) {
          Store.removeCaught(e.currentTarget.dataset.id)
          this.loadData()
          wx.showToast({ title: '已取消' })
        }
      }
    })
  },

  deletePost(e) {
    wx.showModal({
      title: '确定删除？',
      success: (res) => {
        if (res.confirm) {
          Store.deletePost(e.currentTarget.dataset.id)
          this.loadData()
          wx.showToast({ title: '已删除' })
        }
      }
    })
  }
})
