const auth = require('../../utils/auth')
const Store = require('../../utils/store')

Page({
  data: {
    isLoggedIn: false,
    feed: [],
    page: 1,
    hasMore: true,
    loading: false
  },

  onShow() {
    const user = auth.getUser()
    const isLoggedIn = auth.isLoggedIn()

    this.setData({
      isLoggedIn,
      user
    })

    if (isLoggedIn) {
      this.loadFeed()
    }
  },

  // 加载内容流
  async loadFeed() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const result = await wx.cloud.callFunction({
        name: 'getFeed',
        data: {
          page: this.data.page,
          pageSize: 20
        }
      })

      if (result.result && result.result.success) {
        const newFeed = result.result.data.map(post => ({
          ...post,
          timeText: this._formatTime(post.createdAt),
          isLiked: Store.isLikedPost(post._id)
        }))

        this.setData({
          feed: [...this.data.feed, ...newFeed],
          page: this.data.page + 1,
          hasMore: result.result.hasMore
        })
        return
      }
    } catch (error) {
      console.error('加载内容流失败:', error)
      // 云函数调用失败，使用本地数据回退
      this._loadLocalFeed()
      return
    } finally {
      this.setData({ loading: false })
    }
    
    // 如果云函数返回不成功，也尝试本地数据
    if (this.data.feed.length === 0) {
      this._loadLocalFeed()
    }
  },

  // 从本地加载feed数据（回退方案）
  _loadLocalFeed() {
    const store = Store.get()
    const localPosts = store.posts || []
    
    if (localPosts.length === 0) {
      wx.showToast({ title: '暂无内容，快去发布吧', icon: 'none' })
      return
    }

    // 格式化本地数据
    const localFeed = localPosts.map(post => ({
      _id: post.id,
      content: post.content,
      mood: post.mood || '',
      quote: post.quote || null,
      likeCount: post.likes || 0,
      commentCount: 0,
      user: { nickName: '微光用户', avatarUrl: '' },
      createdAt: new Date(post.time).toISOString(),
      timeText: Store.formatTime(post.time),
      isLiked: Store.isLikedPost(post.id)
    }))

    this.setData({
      feed: localFeed,
      hasMore: false
    })
  },

  // 加载更多
  loadMore() {
    this.loadFeed()
  },

  // 点赞
  async toggleLike(e) {
    const { id, index } = e.currentTarget.dataset
    if (!id) return

    const store = Store.get()
    if (!store.likedFeedPosts) store.likedFeedPosts = []

    const idx = store.likedFeedPosts.indexOf(id)
    const feed = [...this.data.feed]

    if (idx === -1) {
      // 点赞
      store.likedFeedPosts.push(id)
      feed[index].isLiked = true
      feed[index].likeCount = (feed[index].likeCount || 0) + 1
    } else {
      // 取消点赞
      store.likedFeedPosts.splice(idx, 1)
      feed[index].isLiked = false
      feed[index].likeCount = Math.max(0, (feed[index].likeCount || 0) - 1)
    }

    Store.save(store)
    this.setData({ feed })

    // 同步到云端
    auth.enqueueSync({
      type: idx === -1 ? 'like' : 'unlike',
      data: { targetType: 'post', targetId: id }
    })
  },

  // 去登录
  goToLogin() {
    wx.switchTab({ url: '/pages/space/space' })
  },

  // 格式化时间
  _formatTime(dateStr) {
    if (!dateStr) return ''

    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date

    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour

    if (diff < minute) return '刚刚'
    if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
    if (diff < day) return `${Math.floor(diff / hour)} 小时前`
    if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
})
