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
    try {
      const config = wx.getStorageSync('glimmer_api_config') || {}
      const quota = wx.getStorageSync('glimmer_quota') || { date: new Date().toISOString().slice(0,10), used: 0 }
      const today = new Date().toISOString().slice(0,10)
      
      this.setData({
        modelIndex: config.model === 'glm-4' ? 1 : config.model === 'ernie-bot' ? 2 : 0,
        apiUrlInput: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKeyInput: config.key ? '••••••••' : '',
        quotaUsed: quota.date === today ? quota.used : 0
      })
    } catch(e) {}
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
      try { key = wx.getStorageSync('glimmer_api_config').key } catch(e) {}
    }

    this.setData({ saving: true })

    try {
      await new Promise((resolve, reject) => {
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
            if (res.statusCode === 200) resolve()
            else reject(new Error(res.data?.error?.message || res.statusCode))
          },
          fail(err) { reject(err) }
        })
      })

      wx.setStorageSync('glimmer_api_config', { key, model, baseUrl })
      wx.setStorageSync('glimmer_api_setup_done', '1')
      wx.showToast({ title: '验证成功', icon: 'success' })
      this.setData({ showSettings: false })
    } catch(e) {
      wx.showToast({ title: `验证失败: ${e.message || e.errMsg}`, icon: 'none', duration: 3000 })
    } finally {
      this.setData({ saving: false })
    }
  },

  getStore() {
    try {
      return wx.getStorageSync('wg_data') || { caughtQuotes: [], posts: [], likedQuotes: [], likedPosts: [] }
    } catch(e) {
      return { caughtQuotes: [], posts: [], likedQuotes: [], likedPosts: [] }
    }
  },

  saveStore(data) {
    wx.setStorageSync('wg_data', data)
  },

  loadData() {
    const store = this.getStore()
    const likedPosts = store.likedPosts || []
    const posts = store.posts.map(p => ({
      ...p,
      timeText: this.formatTime(p.time),
      liked: likedPosts.includes(p.id)
    }))

    this.setData({
      caught: store.caughtQuotes,
      posts: posts,
      caughtCount: store.caughtQuotes.length,
      postCount: store.posts.length,
      likeCount: store.posts.reduce((s, p) => s + (p.likes || 0), 0)
    })
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab })
  },

  toggleLike(e) {
    const store = this.getStore()
    if (!store.likedPosts) store.likedPosts = []
    const id = e.currentTarget.dataset.id
    const post = store.posts.find(p => p.id === id)
    const idx = store.likedPosts.indexOf(id)

    if (idx === -1) {
      store.likedPosts.push(id)
      if (post) post.likes = (post.likes || 0) + 1
    } else {
      store.likedPosts.splice(idx, 1)
      if (post) post.likes = Math.max(0, (post.likes || 0) - 1)
    }

    this.saveStore(store)
    this.loadData()
  },

  removeCaught(e) {
    wx.showModal({
      title: '确定取消捕捉？',
      success: (res) => {
        if (res.confirm) {
          const store = this.getStore()
          store.caughtQuotes = store.caughtQuotes.filter(x => x.id !== e.currentTarget.dataset.id)
          this.saveStore(store)
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
          const store = this.getStore()
          store.posts = store.posts.filter(p => p.id !== e.currentTarget.dataset.id)
          store.likedPosts = (store.likedPosts || []).filter(id => id !== e.currentTarget.dataset.id)
          this.saveStore(store)
          this.loadData()
          wx.showToast({ title: '已删除' })
        }
      }
    })
  },

  formatTime(ts) {
    const d = Date.now() - ts
    if (d < 60000) return '刚刚'
    if (d < 3600000) return Math.floor(d / 60000) + '分钟前'
    if (d < 86400000) return Math.floor(d / 3600000) + '小时前'
    return Math.floor(d / 86400000) + '天前'
  }
})
