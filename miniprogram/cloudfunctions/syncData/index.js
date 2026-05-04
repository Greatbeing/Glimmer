const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { operations } = event

  if (!operations || operations.length === 0) {
    return { success: true, synced: 0 }
  }

  let syncedCount = 0
  const errors = []

  try {
    // 获取用户 ID
    const userResult = await db.collection('users').where({ _openid: openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    const userId = userResult.data[0]._id

    // 批量处理操作
    for (const op of operations) {
      try {
        switch (op.type) {
          case 'like':
            await syncLike(userId, op)
            break
          case 'unlike':
            await unlike(userId, op)
            break
          case 'catch':
            await syncCatch(userId, op)
            break
          case 'uncatch':
            await uncatch(userId, op)
            break
          case 'post':
            await syncPost(userId, op)
            break
          case 'updatePost':
            await updatePost(userId, op)
            break
          case 'checkin':
            await syncCheckin(userId, op)
            break
          default:
            console.warn('未知操作类型:', op.type)
        }
        syncedCount++
      } catch (err) {
        console.error(`操作 ${op.type} 失败:`, err)
        errors.push({ type: op.type, error: err.message })
      }
    }

    return { success: true, synced: syncedCount, errors }
  } catch (error) {
    console.error('同步失败:', error)
    return { success: false, message: error.message }
  }
}

// 同步点赞
async function syncLike(userId, op) {
  const { targetType, targetId } = op.data

  // 检查是否已点赞
  const existing = await db.collection('likes').where({
    userId,
    targetType,
    targetId
  }).get()

  if (existing.data.length === 0) {
    // 创建点赞记录
    await db.collection('likes').add({
      data: {
        userId,
        targetType,
        targetId,
        createdAt: db.serverDate()
      }
    })

    // 更新目标点赞数
    const targetCollection = targetType === 'quote' ? 'quotes' : 'posts'
    await db.collection(targetCollection).doc(targetId).update({
      data: { likeCount: _.inc(1) }
    })
  }
}

// 取消点赞
async function unlike(userId, op) {
  const { targetType, targetId } = op.data

  const existing = await db.collection('likes').where({
    userId,
    targetType,
    targetId
  }).get()

  if (existing.data.length > 0) {
    await db.collection('likes').doc(existing.data[0]._id).remove()

    const targetCollection = targetType === 'quote' ? 'quotes' : 'posts'
    await db.collection(targetCollection).doc(targetId).update({
      data: { likeCount: _.inc(-1) }
    })
  }
}

// 同步收藏
async function syncCatch(userId, op) {
  const { quoteId } = op.data

  const existing = await db.collection('catches').where({
    userId,
    quoteId
  }).get()

  if (existing.data.length === 0) {
    await db.collection('catches').add({
      data: {
        userId,
        quoteId,
        createdAt: db.serverDate()
      }
    })

    // 更新用户收藏统计
    await db.collection('users').doc(userId).update({
      data: { 'stats.catches': _.inc(1) }
    })
  }
}

// 取消收藏
async function uncatch(userId, op) {
  const { quoteId } = op.data

  const existing = await db.collection('catches').where({
    userId,
    quoteId
  }).get()

  if (existing.data.length > 0) {
    await db.collection('catches').doc(existing.data[0]._id).remove()

    await db.collection('users').doc(userId).update({
      data: { 'stats.catches': _.inc(-1) }
    })
  }
}

// 同步发布
async function syncPost(userId, op) {
  const postData = op.data

  const newPost = await db.collection('posts').add({
    data: {
      userId,
      quoteId: postData.quoteId || null,
      content: postData.content || '',
      moodTag: postData.moodTag || '',
      isPublic: postData.isPublic !== false,
      likeCount: 0,
      commentCount: 0,
      createdAt: db.serverDate()
    }
  })

  // 更新用户发布统计
  await db.collection('users').doc(userId).update({
    data: { 'stats.posts': _.inc(1) }
  })

  return newPost._id
}

// 更新发布
async function updatePost(userId, op) {
  const { postId, data } = op.data

  const post = await db.collection('posts').doc(postId).get()
  if (post.data && post.data.userId === userId) {
    await db.collection('posts').doc(postId).update({
      data: { ...data, updatedAt: db.serverDate() }
    })
  }
}

// 同步签到
async function syncCheckin(userId, op) {
  const { date, streak, reward } = op.data

  // 检查今天是否已签到
  const existing = await db.collection('checkins').where({
    userId,
    date
  }).get()

  if (existing.data.length === 0) {
    await db.collection('checkins').add({
      data: {
        userId,
        date,
        streak,
        reward,
        createdAt: db.serverDate()
      }
    })

    // 更新用户连续打卡天数和额度
    await db.collection('users').doc(userId).update({
      data: {
        'stats.checkinStreak': streak,
        'llmQuota.bonus': _.inc(reward)
      }
    })
  }
}
