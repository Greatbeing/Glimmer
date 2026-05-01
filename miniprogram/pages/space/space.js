Page({
  data: {
    activeTab: 'caught',
    caught: [],
    posts: [],
    caughtCount: 0,
    postCount: 0,
    likeCount: 0
  },

  onShow() {
    this.loadData()
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
