const { ApiConfig, QuotaManager } = require('../../utils/quoteService')
const Store = require('../../utils/store')

// Constants
const API_TIMEOUT = 5000

Page({
  data: {
    activeTab: 'caught',
    caught: [],
    posts: [],
    caughtCount: 0,
    postCount: 0,
    likeCount: 0,
    // API Settings
    showSettings: false,
    apiKeyInput: '',
    showKey: false,
    modelOptions: ['通义千问 (qwen-turbo)', '智谱清言 (glm-4)', '文心一言 (ernie-bot)'],
    modelIndex: 0,
    apiUrlInput: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    quotaUsed: 0,
    saving: false
  },

  onShow() {
    this.loadData()
    this.loadApiConfig()
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
      // Sync with ApiConfig module to ensure in-memory state is updated
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
