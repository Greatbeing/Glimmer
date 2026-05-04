const app = getApp()
const { ApiConfig, QuotaManager, QuoteCache, QuoteRouter } = require('../../utils/quoteService')
const Store = require('../../utils/store')
const shareCardGenerator = require('../../utils/shareCard')

// Constants
const LIKE_COUNT_BASE = 50
const LIKE_COUNT_RANGE = 300
const MUSIC_NOTES = {
  literature: { freq: 440, label: 'A' },    // A4
  philosophy: { freq: 494, label: 'B' },   // B4
  psychology: { freq: 523, label: 'C' },   // C5
  counterintuitive: { freq: 587, label: 'D' } // D5
}

Page({
  data: {
    quotes: [],
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
    categoryText: '',
    canvasWidth: 600,
    canvasHeight: 800,
    // New: swipe animation
    swipeOffset: 0,
    swipeOpacity: 1,
    // New: comments
    commentCount: 0,
    commentInput: '',
    showComments: false,
    currentComments: []
  },

  // Background audio context
  bgAudioManager: null,

  onLoad() {
    const quotes = app.globalData.quotes
    ApiConfig.load()
    this.setData({ quotes, showApiIcon: !ApiConfig.isConfigured() })
    this.showQuote()
    this.loadComments()

    // Initialize background audio manager
    this.bgAudioManager = wx.getBackgroundAudioManager()
    this.bgAudioManager.title = 'Glimmer 微光'
    this.bgAudioManager.onPlay(() => {
      console.log('背景音乐开始播放')
    })
    this.bgAudioManager.onPause(() => {
      this.setData({ isPlaying: false })
    })
    this.bgAudioManager.onStop(() => {
      this.setData({ isPlaying: false })
    })
    this.bgAudioManager.onError((err) => {
      console.error('背景音乐播放错误:', err)
      this.setData({ isPlaying: false })
    })

    // Preload LLM quotes if configured
    if (ApiConfig.isConfigured()) {
      QuoteRouter.preloadQuotes(quotes, 3)
    }
  },

  onUnload() {
    // Stop music when page unloads
    if (this.data.isPlaying && this.bgAudioManager) {
      this.bgAudioManager.stop()
    }
  },

  // 分享语录
  async shareQuote() {
    wx.showLoading({ title: '生成卡片...' })

    try {
      const quote = this.data.currentQuote
      const user = app.globalData.user || {}

      const imagePath = await shareCardGenerator.generateQuoteCard(quote, user, {
        mode: 'portrait',
        showQRCode: true
      })

      wx.hideLoading()

      // 显示分享选项
      wx.showActionSheet({
        itemList: ['分享给好友', '保存到相册'],
        success: async (res) => {
          if (res.tapIndex === 0) {
            // 分享给好友
            wx.shareAppMessage({
              title: `${quote.zh.substring(0, 30)}...`,
              imageUrl: imagePath,
              path: `/pages/index/index?quoteId=${quote.id}`
            })
          } else if (res.tapIndex === 1) {
            // 保存到相册
            await shareCardGenerator.saveToAlbum(imagePath)
          }
        }
      })
    } catch (error) {
      wx.hideLoading()
      console.error('生成分享卡片失败:', error)
      // 降级：分享纯文本
      this._shareTextFallback()
    }
  },

  // 降级文本分享
  _shareTextFallback() {
    const quote = this.data.currentQuote
    const text = `"${quote.zh}"\n\n——《${quote.source}》 ${quote.tag || ''}\n\n来自 Glimmer 微光`

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制，请粘贴分享', icon: 'none' })
      }
    })
  },

  // Deterministic like count based on quote ID
  getLikeCount(id) {
    const hash = id.split('').reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0)
    return LIKE_COUNT_BASE + (Math.abs(hash) % LIKE_COUNT_RANGE)
  },

  showQuote() {
    const q = this.data.quotes[this.data.currentIndex]
    if (!q) return
    
    const categoryMap = { literature: '文学', philosophy: '哲学', psychology: '心理', counterintuitive: '反常识' }
    const categoryText = categoryMap[q.category] || ''

    this.setData({
      currentQuote: q,
      currentIndex: this.data.currentIndex,
      isLiked: Store.isLikedPost(q.id) || false,
      isCaught: Store.isCaught(q.id),
      likeCount: this.getLikeCount(q.id),
      categoryText,
      swipeOffset: 0,
      swipeOpacity: 1,
      showComments: false
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
    if (this.data.isPlaying) {
      // Stop music
      if (this.bgAudioManager) {
        this.bgAudioManager.stop()
      }
      this.setData({ isPlaying: false })
      wx.showToast({ title: '音乐已停止', icon: 'none' })
    } else {
      // Play music - use a simple tone or ambient sound
      // Since we don't have a real audio file, we'll use a placeholder
      // In production, replace with actual ambient music URL
      if (this.bgAudioManager) {
        // You can replace this URL with your own ambient music
        this.bgAudioManager.src = 'https://webapi-ssl.qq.com/cgi-bin/musicu-fcgi?cmd=Play&songid=002OdMkX0gKwKZ' // Placeholder
        this.bgAudioManager.play().catch(() => {
          wx.showToast({ title: '音乐播放需要音频资源', icon: 'none' })
          this.setData({ isPlaying: false })
        })
        this.setData({ isPlaying: true })
        wx.showToast({ title: '播放中（需配置音频URL）', icon: 'none' })
      }
    }
  },

  toggleComment() {
    const showComments = !this.data.showComments
    this.setData({ showComments })
    
    if (showComments) {
      this.loadComments()
    }
  },

  // Load comments for current quote
  loadComments() {
    const quoteId = this.data.currentQuote.id
    if (!quoteId) return
    
    const store = Store.get()
    const comments = store.comments && store.comments[quoteId] ? store.comments[quoteId] : []
    this.setData({ commentCount: comments.length, currentComments: comments })
  },

  // Submit a new comment
  submitComment() {
    const content = this.data.commentInput.trim()
    if (!content) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    const quoteId = this.data.currentQuote.id
    if (!quoteId) return

    const store = Store.get()
    if (!store.comments) store.comments = {}
    if (!store.comments[quoteId]) store.comments[quoteId] = []

    const newComment = {
      id: 'c' + Date.now(),
      content: content,
      time: Date.now(),
      user: app.globalData.user ? app.globalData.user.nickName : '微光用户'
    }

    store.comments[quoteId].push(newComment)
    Store.save(store)

    this.setData({
      commentInput: '',
      commentCount: store.comments[quoteId].length,
      currentComments: store.comments[quoteId]
    })

    wx.showToast({ title: '评论成功' })
  },

  // Handle comment input
  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value })
  },

  onTouchStart(e) {
    this.setData({ 
      startY: e.touches[0].clientY, 
      isDragging: true,
      swipeOffset: 0,
      swipeOpacity: 1
    })
  },

  onTouchMove(e) {
    if (!this.data.isDragging || this.data.isLoading) return
    
    const currentY = e.touches[0].clientY
    const diff = this.data.startY - currentY
    const maxOffset = 200
    
    // Calculate swipe offset and opacity
    let offset = diff
    let opacity = 1 - Math.abs(diff) / (maxOffset * 1.5)
    
    // Clamp values
    offset = Math.max(-maxOffset, Math.min(maxOffset, offset))
    opacity = Math.max(0.3, Math.min(1, opacity))
    
    this.setData({
      swipeOffset: offset,
      swipeOpacity: opacity
    })
  },

  async onTouchEnd(e) {
    if (!this.data.isDragging) return
    this.setData({ isDragging: false })
    const diff = this.data.startY - e.changedTouches[0].clientY
    
    // Reset swipe animation
    this.setData({ swipeOffset: 0, swipeOpacity: 1 })
    
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
        
        this.setData({
          quotes,
          currentIndex: quotes.length - 1,
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
