const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { page = 1, pageSize = 20 } = event

    // 查询公开动态，按时间倒序
    const postsResult = await db.collection('posts')
      .where({ isPublic: true })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取用户信息
    const userIds = [...new Set(postsResult.data.map(p => p.userId))]
    const usersResult = await db.collection('users')
      .where({ _id: _.in(userIds) })
      .field({ _id: true, nickname: true, avatarUrl: true })
      .get()

    // 构建用户映射
    const userMap = {}
    usersResult.data.forEach(u => {
      userMap[u._id] = { nickname: u.nickname, avatarUrl: u.avatarUrl }
    })

    // 合并数据
    const feed = postsResult.data.map(post => ({
      ...post,
      nickname: userMap[post.userId]?.nickname || '微光用户',
      avatarUrl: userMap[post.userId]?.avatarUrl || ''
    }))

    return {
      success: true,
      data: feed,
      hasMore: postsResult.data.length === pageSize
    }

  } catch (error) {
    console.error('获取内容流失败:', error)
    return {
      success: false,
      message: error.message || '获取内容流失败'
    }
  }
}
