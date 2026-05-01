const app = getApp()

Page({
  data: {
    quotes: [],
    currentQuote: {},
    currentIndex: 0,
    isLiked: false,
    isCaught: false,
    likeCount: 0,
    isPlaying: false,
    startY: 0
  },

  onLoad() {
    this.setData({ quotes: app.globalData.quotes })
    this.showQuote()
  },

  showQuote() {
    const q = this.data.quotes[this.data.currentIndex]
    const store = this.getStore()
    
    this.setData({
      currentQuote: q,
      isLiked: store.likedQuotes.includes(q.id),
      isCaught: store.caughtQuotes.some(x => x.id === q.id),
      likeCount: Math.floor(Math.random() * 300) + 50
    })
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

  toggleLike() {
    const store = this.getStore()
    const id = this.data.currentQuote.id
    const idx = store.likedQuotes.indexOf(id)
    
    if (idx === -1) store.likedQuotes.push(id)
    else store.likedQuotes.splice(idx, 1)
    
    this.saveStore(store)
    this.setData({ isLiked: idx === -1 })
  },

  catchQuote() {
    const store = this.getStore()
    if (store.caughtQuotes.some(x => x.id === this.data.currentQuote.id)) {
      wx.showToast({ title: '已捕捉过', icon: 'none' })
      return
    }
    
    store.caughtQuotes.unshift(this.data.currentQuote)
    this.saveStore(store)
    this.setData({ isCaught: true })
    wx.showToast({ title: '捕捉成功！' })
  },

  toggleMusic() {
    this.setData({ isPlaying: !this.data.isPlaying })
    if (this.data.isPlaying) {
      wx.showToast({ title: '播放音乐', icon: 'none' })
    }
  },

  onTouchStart(e) {
    this.setData({ startY: e.touches[0].clientY })
  },

  onTouchEnd(e) {
    const diff = this.data.startY - e.changedTouches[0].clientY
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        this.setData({ currentIndex: (this.data.currentIndex + 1) % this.data.quotes.length })
      } else {
        this.setData({ currentIndex: (this.data.currentIndex - 1 + this.data.quotes.length) % this.data.quotes.length })
      }
      this.showQuote()
    }
  }
})
