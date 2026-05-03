// ====== Shared Store Module ======
const STORE_KEY = 'wg_data'

const Store = {
  get() {
    try {
      return wx.getStorageSync(STORE_KEY) || { posts: [], likedPosts: [], likedQuotes: [], caught: [], comments: {} }
    } catch(e) {
      return { posts: [], likedPosts: [], likedQuotes: [], caught: [], comments: {} }
    }
  },

  save(data) {
    wx.setStorageSync(STORE_KEY, data)
  },

  addPost(post) {
    const store = this.get()
    store.posts.unshift({
      id: 'p' + Date.now(),
      ...post,
      time: Date.now(),
      likes: 0
    })
    this.save(store)
  },

  deletePost(id) {
    const store = this.get()
    store.posts = store.posts.filter(p => p.id !== id)
    this.save(store)
  },

  toggleLikePost(id) {
    const store = this.get()
    const idx = store.likedPosts.indexOf(id)
    const post = store.posts.find(p => p.id === id)
    
    if (post) {
      post.likes += (idx === -1 ? 1 : -1)
    }
    if (idx === -1) {
      store.likedPosts.push(id)
    } else {
      store.likedPosts.splice(idx, 1)
    }
    
    this.save(store)
    return idx === -1
  },

  isLikedPost(id) {
    const store = this.get()
    return store.likedPosts && store.likedPosts.includes(id)
  },

  addCaught(quote) {
    const store = this.get()
    if (!store.caught) store.caught = []
    if (!store.caught.find(x => x.id === quote.id)) {
      store.caught.unshift(quote)
      this.save(store)
      return true
    }
    return false
  },

  removeCaught(id) {
    const store = this.get()
    if (!store.caught) store.caught = []
    store.caught = store.caught.filter(x => x.id !== id)
    this.save(store)
  },

  getCaught() {
    const store = this.get()
    return store.caught || []
  },

  isCaught(id) {
    const store = this.get()
    return store.caught && store.caught.some(x => x.id === id)
  },

  formatTime(ts) {
    const d = Date.now() - ts
    if (d < 60000) return '刚刚'
    if (d < 3600000) return Math.floor(d / 60000) + '分钟前'
    if (d < 86400000) return Math.floor(d / 3600000) + '小时前'
    return Math.floor(d / 86400000) + '天前'
  }
}

module.exports = Store
