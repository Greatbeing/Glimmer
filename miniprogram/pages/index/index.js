const app = getApp()
const { ApiConfig, QuotaManager, QuoteCache, QuoteRouter } = require('../../utils/quoteService')

Page({
  data: {
    quotes: [],
    dots: [],
    currentQuote: {},
    currentIndex: 0,
    isLiked: false,
    isCaught: false,
    likeCount: 0,
    isPlaying: false,
    startY: 0,
    isDragging: false,
    isLoading: false,
    showApiIcon: false,
    loadingText: ''
  },

  onLoad() {
    const quotes = app.globalData.quotes
    ApiConfig.load()
    this.setData({ quotes, dots: quotes.map(() => 0), showApiIcon: !ApiConfig.isConfigured() })
    this.showQuote()

    // Preload LLM quotes if configured
    if (ApiConfig.isConfigured()) {
      QuoteRouter.preloadQuotes(quotes, 3)
    }
  },

  showQuote() {
    const q = this.data.quotes[this.data.currentIndex]
    if (!q) return
    const store = this.getStore()
    const dots = this.data.dots.map((_, i) => i === this.data.currentIndex ? 1 : 0)

    const categoryMap = { literature: '文学', philosophy: '哲学', psychology: '心理', counterintuitive: '反常识' }
    const categoryText = categoryMap[q.category] || ''

    this.setData({
      currentQuote: q,
      currentIndex: this.data.currentIndex,
      dots,
      isLiked: store.likedQuotes.includes(q.id),
      isCaught: store.caughtQuotes.some(x => x.id === q.id),
      likeCount: Math.floor(Math.random() * 300) + 50,
      categoryText
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

  toggleComment() {
    wx.showToast({ title: '评论功能开发中', icon: 'none' })
  },

  onTouchStart(e) {
    this.setData({ startY: e.touches[0].clientY, isDragging: true })
  },

  onTouchMove(e) {
    if (!this.data.isDragging) return
  },

  async onTouchEnd(e) {
    if (!this.data.isDragging) return
    this.setData({ isDragging: false })
    const diff = this.data.startY - e.changedTouches[0].clientY
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        await this.nextQuote()
      } else {
        this.setData({ currentIndex: (this.data.currentIndex - 1 + this.data.quotes.length) % this.data.quotes.length })
        this.showQuote()
      }
    }
  },

  async nextQuote() {
    const q = this.data.currentQuote
    // If current quote is LLM-generated or we're at the end of presets, try LLM
    if (q.isLLM || this.data.currentIndex >= this.data.quotes.length - 1) {
      if (!ApiConfig.isConfigured()) {
        // Show settings hint
        wx.showModal({
          title: '开启 AI 语录',
          content: '配置 API Key 后可无限生成高质量金句',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/space/space' })
            }
          }
        })
        return
      }

      this.setData({ isLoading: true, loadingText: '正在寻找下一条微光...' })

      try {
        const newQuote = await QuoteRouter.getNextQuote(this.data.quotes)
        const quotes = this.data.quotes
        quotes.push(newQuote)
        const dots = quotes.map((_, i) => i === quotes.length - 1 ? 1 : 0)

        const categoryMap = { literature: '文学', philosophy: '哲学', psychology: '心理', counterintuitive: '反常识' }
        const categoryText = categoryMap[newQuote.category] || ''
        const store = this.getStore()

        this.setData({
          quotes,
          currentIndex: quotes.length - 1,
          dots,
          currentQuote: newQuote,
          isLiked: false,
          isCaught: store.caughtQuotes.some(x => x.id === newQuote.id),
          likeCount: Math.floor(Math.random() * 300) + 50,
          categoryText,
          isLoading: false
        })
      } catch (e) {
        this.setData({ isLoading: false })
        wx.showToast({ title: e.message || '加载失败', icon: 'none' })
      }
    } else {
      this.setData({ currentIndex: this.data.currentIndex + 1 })
      this.showQuote()
    }
  },

  // Navigate to settings
  goToSettings() {
    wx.navigateTo({ url: '/pages/space/space' })
  }
})
