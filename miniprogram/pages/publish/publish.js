const Store = require('../../utils/store')

// Simple local sensitive word filter (basic level)
const SENSITIVE_WORDS = [
  '敏感词1', '敏感词2', '广告', '推广', '加微信'
]

Page({
  data: {
    content: '',
    selectedMood: '',
    posts: [],
    charCount: 0,
    maxChars: 500
  },

  onShow() {
    this.loadPosts()
  },

  loadPosts() {
    const store = Store.get()
    const posts = store.posts.map(p => ({
      ...p,
      timeText: Store.formatTime(p.time),
      liked: Store.isLikedPost(p.id)
    }))
    this.setData({ posts })
  },

  onInput(e) {
    const value = e.detail.value
    this.setData({ 
      content: value,
      charCount: value.length
    })
  },

  selectMood(e) {
    this.setData({ selectedMood: e.currentTarget.dataset.mood })
  },

  publish() {
    const content = this.data.content.trim()
    
    if (!content) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    if (content.length > this.data.maxChars) {
      wx.showToast({ title: `内容超过${this.data.maxChars}字限制`, icon: 'none' })
      return
    }

    // Local sensitive word check first
    if (this._checkLocalSensitiveWords(content)) {
      wx.showToast({ title: '内容包含敏感信息，请修改后重试', icon: 'none' })
      return
    }

    // Content security check using wx API
    // Try to use cloud security check if available
    if (wx.cloud) {
      wx.showLoading({ title: '内容检测中...' })
      
      wx.cloud.callFunction({
        name: 'contentCheck',
        data: { content },
        success: (res) => {
          wx.hideLoading()
          if (res.result && res.result.pass) {
            this._doPublish()
          } else {
            wx.showToast({ title: '内容未通过安全检测', icon: 'none' })
          }
        },
        fail: () => {
          wx.hideLoading()
          // Cloud check failed, use local check result (already passed)
          this._doPublish()
        }
      })
    } else {
      // No cloud environment, proceed directly (local check already passed)
      this._doPublish()
    }
  },

  // Local sensitive word detection
  _checkLocalSensitiveWords(content) {
    return SENSITIVE_WORDS.some(word => content.includes(word))
  },

  _doPublish() {
    Store.addPost({
      content: this.data.content.trim(),
      mood: this.data.selectedMood
    })
    
    this.setData({ content: '', selectedMood: '' })
    this.loadPosts()
    wx.showToast({ title: '发布成功！' })
  },

  toggleLike(e) {
    const id = e.currentTarget.dataset.id
    Store.toggleLikePost(id)
    this.loadPosts()
  },

  deletePost(e) {
    wx.showModal({
      title: '确定删除？',
      success: (res) => {
        if (res.confirm) {
          Store.deletePost(e.currentTarget.dataset.id)
          this.loadPosts()
          wx.showToast({ title: '已删除' })
        }
      }
    })
  }
})
