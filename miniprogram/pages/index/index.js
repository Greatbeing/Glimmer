const app = getApp()
const { ApiConfig, QuotaManager, QuoteCache, QuoteRouter } = require('../../utils/quoteService')
const Store = require('../../utils/store')

// Constants
const LIKE_COUNT_BASE = 50
const LIKE_COUNT_RANGE = 300
const MAX_VISIBLE_DOTS = 10

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
    loadingText: '',
    categoryText: ''
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

  // Deterministic like count based on quote ID
  getLikeCount(id) {
    const hash = id.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    return LIKE_COUNT_BASE + (Math.abs(hash) % LIKE_COUNT_RANGE)
  },

  showQuote() {
    const q = this.data.quotes[this.data.currentIndex]
    if (!q) return
    
    const dots = this.data.dots.map((_, i) => i === this.data.currentIndex ? 1 : 0)
    const categoryMap = { literature: '文学', philosophy: '哲学', psychology: '心理', counterintuitive: '反常识' }
    const categoryText = categoryMap[q.category] || ''

    this.setData({
      currentQuote: q,
      currentIndex: this.data.currentIndex,
      dots,
      isLiked: Store.isLikedPost(q.id) || false,
      isCaught: Store.isCaught(q.id),
      likeCount: this.getLikeCount(q.id),
      categoryText
    })
  },

  toggleLike() {
    const id = this.data.currentQuote.id
    const store = Store.get()
    if (!store.likedQuotes) store.likedQuotes = []
    const idx = store.likedQuotes.indexOf(id)

    if (idx === -1) store.likedQuotes.push(id)
    else store.likedQuotes.splice(idx, 1)

    Store.save(store)
    this.setData({ isLiked: idx === -1 })
  },

  catchQuote() {
    const q = this.data.currentQuote
    if (Store.isCaught(q.id)) {
      wx.showToast({ title: '已捕捉过', icon: 'none' })
      return
    }

    Store.addCaught(q)
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
        const quotes = [...this.data.quotes, newQuote]
        const categoryMap = { literature: '文学', philosophy: '哲学', psychology: '心理', counterintuitive: '反常识' }
        const categoryText = categoryMap[newQuote.category] || ''
        
        // Limit dots display
        const dots = quotes.length <= MAX_VISIBLE_DOTS 
          ? quotes.map((_, i) => i === quotes.length - 1 ? 1 : 0)
          : []

        this.setData({
          quotes,
          currentIndex: quotes.length - 1,
          dots,
          currentQuote: newQuote,
          isLiked: false,
          isCaught: Store.isCaught(newQuote.id),
          likeCount: this.getLikeCount(newQuote.id),
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
