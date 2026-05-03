const Store = require('../../utils/store')

Page({
  data: {
    content: '',
    selectedMood: '',
    posts: []
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
    this.setData({ content: e.detail.value })
  },

  selectMood(e) {
    this.setData({ selectedMood: e.currentTarget.dataset.mood })
  },

  publish() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    // Content security check using wx API
    const content = this.data.content.trim()
    
    // Try to use security check if available
    if (wx.cloud) {
      wx.cloud.callFunction({
        name: 'contentCheck',
        data: { content },
        success: (res) => {
          if (res.result && res.result.pass) {
            this._doPublish()
          } else {
            wx.showToast({ title: '内容包含敏感信息，请修改后重试', icon: 'none' })
          }
        },
        fail: () => {
          // Fallback: proceed without cloud check
          this._doPublish()
        }
      })
    } else {
      // No cloud environment, proceed directly
      this._doPublish()
    }
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
