const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 生成 6 位随机邀请码
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// 检查邀请码是否已存在
async function isInviteCodeExists(code) {
  const result = await db.collection('users').where({ inviteCode: code }).count()
  return result.total > 0
}

// 生成唯一邀请码
async function generateUniqueInviteCode() {
  let code = generateInviteCode()
  let attempts = 0
  while (await isInviteCodeExists(code) && attempts < 10) {
    code = generateInviteCode()
    attempts++
  }
  return code
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查找用户是否已存在
    const userResult = await db.collection('users').where({ _openid: openid }).get()

    if (userResult.data.length > 0) {
      // 用户已存在，更新信息
      const existingUser = userResult.data[0]
      const updates = {}

      if (event.userInfo && !event.silent) {
        updates.nickname = event.userInfo.nickName
        updates.avatarUrl = event.userInfo.avatarUrl
        updates.updatedAt = db.serverDate()
      }

      if (Object.keys(updates).length > 0) {
        await db.collection('users').doc(existingUser._id).update({ data: updates })
      }

      return {
        success: true,
        data: {
          ...existingUser,
          ...updates,
          _openid: undefined // 不返回 openid
        }
      }
    }

    // 新用户，创建记录
    const inviteCode = await generateUniqueInviteCode()
    const now = db.serverDate()

    // 处理邀请关系
    let invitedBy = null
    let inviterId = null

    if (event.inviteCode) {
      const inviterResult = await db.collection('users').where({
        inviteCode: event.inviteCode
      }).get()

      if (inviterResult.data.length > 0) {
        invitedBy = event.inviteCode
        inviterId = inviterResult.data[0]._id
      }
    }

    const newUser = {
      _openid: openid,
      nickname: event.userInfo ? event.userInfo.nickName : '微光用户',
      avatarUrl: event.userInfo ? event.userInfo.avatarUrl : '',
      inviteCode: inviteCode,
      invitedBy: invitedBy,
      llmQuota: {
        base: 100,
        bonus: 0,
        used: 0,
        resetAt: now
      },
      stats: {
        catches: 0,
        posts: 0,
        likes: 0,
        invites: 0,
        checkinStreak: 0
      },
      createdAt: now,
      updatedAt: now
    }

    const createResult = await db.collection('users').add({ data: newUser })

    // 记录邀请关系并发放奖励
    if (inviterId) {
      // 创建邀请记录
      await db.collection('invites').add({
        data: {
          inviterId: inviterId,
          inviteeId: createResult._id,
          inviteCode: invitedBy,
          rewardGranted: true,
          createdAt: now
        }
      })

      // 给邀请人增加 50 次额度
      await db.collection('users').doc(inviterId).update({
        data: {
          'llmQuota.bonus': _.inc(50),
          'stats.invites': _.inc(1),
          updatedAt: now
        }
      })

      // 给被邀请人增加 50 次额度
      await db.collection('users').doc(createResult._id).update({
        data: {
          'llmQuota.bonus': _.inc(50),
          updatedAt: now
        }
      })
    }

    return {
      success: true,
      data: {
        ...newUser,
        _id: createResult._id,
        _openid: undefined
      }
    }

  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      message: error.message || '登录失败'
    }
  }
}
