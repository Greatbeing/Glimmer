const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取用户
    const userResult = await db.collection('users').where({ _openid: openid }).get()
    if (userResult.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }

    const user = userResult.data[0]
    const userId = user._id
    const now = db.serverDate()

    // 获取今天日期
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // 检查今天是否已签到
    const todayCheckin = await db.collection('checkins').where({
      userId,
      date: todayStr
    }).get()

    if (todayCheckin.data.length > 0) {
      return {
        success: false,
        message: '今天已签到',
        streak: todayCheckin.data[0].streak
      }
    }

    // 计算连续天数
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    const yesterdayCheckin = await db.collection('checkins').where({
      userId,
      date: yesterdayStr
    }).get()

    const streak = yesterdayCheckin.data.length > 0 ? yesterdayCheckin.data[0].streak + 1 : 1

    // 计算奖励
    const reward = calculateReward(streak)

    // 创建签到记录
    await db.collection('checkins').add({
      data: {
        userId,
        date: todayStr,
        streak,
        reward,
        createdAt: now
      }
    })

    // 更新用户连续打卡天数和额度
    await db.collection('users').doc(userId).update({
      data: {
        'stats.checkinStreak': streak,
        'llmQuota.bonus': _.inc(reward),
        updatedAt: now
      }
    })

    // 检查是否达到里程碑
    const milestone = MILESTONES[streak]

    return {
      success: true,
      streak,
      reward,
      milestone: milestone || null,
      message: milestone
        ? `连续打卡 ${streak} 天，获得 ${milestone.name} 徽章！`
        : `连续打卡 ${streak} 天，获得 ${reward} 次额度`
    }

  } catch (error) {
    console.error('签到失败:', error)
    return {
      success: false,
      message: error.message || '签到失败'
    }
  }
}

// 里程碑定义
const MILESTONES = {
  7: { name: '坚持一周', reward: 50 },
  30: { name: '月度达人', reward: 200 },
  100: { name: '百日之光', reward: 500 }
}

// 计算奖励
function calculateReward(streak) {
  if (MILESTONES[streak]) {
    return MILESTONES[streak].reward
  }
  return 10 + Math.floor(streak / 7) * 5
}
