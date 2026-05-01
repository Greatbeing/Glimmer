Page({
  data: {
    content: '',
    selectedMood: '',
    posts: []
  },

  onShow() {
    this.loadPosts()
  },

  getStore() {
    try {
      return wx.getStorageSync('wg_data') || { posts: [], likedPosts: [] }
    } catch(e) {
      return { posts: [], likedPosts: [] }
    }
  },

  saveStore(data) {
    wx.setStorageSync('wg_data', data)
  },

  loadPosts() {
    const store = this.getStore()
    const posts = store.posts.map(p => ({
      ...p,
      timeText: this.formatTime(p.time),
      liked: store.likedPosts.includes(p.id)
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

    const store = this.getStore()
    const post = {
      id: 'p' + Date.now(),
      content: this.data.content.trim(),
      mood: this.data.selectedMood,
      time: Date.now(),
      likes: 0
    }

    store.posts.unshift(post)
    this.saveStore(store)
    
    this.setData({ content: '', selectedMood: '' })
    this.loadPosts()
    wx.showToast({ title: '发布成功！' })
  },

  toggleLike(e) {
    const store = this.getStore()
    const id = e.currentTarget.dataset.id
    const idx = store.likedPosts.indexOf(id)
    const post = store.posts.find(p => p.id === id)
    
    if (post) post.likes += (idx === -1 ? 1 : -1)
    if (idx === -1) store.likedPosts.push(id)
    else store.likedPosts.splice(idx, 1)
    
    this.saveStore(store)
    this.loadPosts()
  },

  deletePost(e) {
    wx.showModal({
      title: '确定删除？',
      success: (res) => {
        if (res.confirm) {
          const store = this.getStore()
          store.posts = store.posts.filter(p => p.id !== e.currentTarget.dataset.id)
          this.saveStore(store)
          this.loadPosts()
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
