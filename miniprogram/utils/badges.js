const Store = require('./store')

class BadgeManager {
  constructor() {
    // 徽章定义
    this.BADGE_DEFINITIONS = {
      // 捕捉徽章
      first_catch: {
        key: 'first_catch',
        name: '初次微光',
        description: '第一次捕捉语录',
        icon: '✦',
        condition: (stats) => stats.catches >= 1
      },
      catch_10: {
        key: 'catch_10',
        name: '微光收集者',
        description: '累积捕捉 10 条语录',
        icon: '✧',
        condition: (stats) => stats.catches >= 10
      },
      catch_50: {
        key: 'catch_50',
        name: '微光猎人',
        description: '累积捕捉 50 条语录',
        icon: '⊹',
        condition: (stats) => stats.catches >= 50
      },
      catch_100: {
        key: 'catch_100',
        name: '微光大师',
        description: '累积捕捉 100 条语录',
        icon: '✶',
        condition: (stats) => stats.catches >= 100
      },
      catch_500: {
        key: 'catch_500',
        name: '微光传说',
        description: '累积捕捉 500 条语录',
        icon: '✸',
        condition: (stats) => stats.catches >= 500
      },

      // 坚持徽章
      checkin_7: {
        key: 'checkin_7',
        name: '坚持一周',
        description: '连续打卡 7 天',
        icon: '☀',
        condition: (stats) => stats.checkinStreak >= 7
      },
      checkin_30: {
        key: 'checkin_30',
        name: '月度达人',
        description: '连续打卡 30 天',
        icon: '☀☀',
        condition: (stats) => stats.checkinStreak >= 30
      },
      checkin_100: {
        key: 'checkin_100',
        name: '百日之光',
        description: '连续打卡 100 天',
        icon: '☀☀☀',
        condition: (stats) => stats.checkinStreak >= 100
      },

      // 邀请徽章
      invite_1: {
        key: 'invite_1',
        name: '引路人',
        description: '成功邀请 1 人注册',
        icon: '↗',
        condition: (stats) => stats.invites >= 1
      },
      invite_5: {
        key: 'invite_5',
        name: '传播者',
        description: '成功邀请 5 人注册',
        icon: '↗↗',
        condition: (stats) => stats.invites >= 5
      },
      invite_20: {
        key: 'invite_20',
        name: '微光大使',
        description: '成功邀请 20 人注册',
        icon: '✦↗',
        condition: (stats) => stats.invites >= 20
      },

      // 发布徽章
      first_post: {
        key: 'first_post',
        name: '初次发声',
        description: '第一次发布动态',
        icon: '📝',
        condition: (stats) => stats.posts >= 1
      },
      post_10: {
        key: 'post_10',
        name: '表达者',
        description: '累积发布 10 条动态',
        icon: '📝📝',
        condition: (stats) => stats.posts >= 10
      }
    }
  }

  // 检查并颁发徽章
  async checkAndAwardBadges(stats) {
    if (!stats) return []

    const store = Store.get()
    if (!store.badges) {
      store.badges = []
    }

    const awardedBadges = []

    for (const [key, badge] of Object.entries(this.BADGE_DEFINITIONS)) {
      // 检查是否已获得
      const alreadyAwarded = store.badges.some(b => b.key === key)
      if (alreadyAwarded) continue

      // 检查条件是否满足
      if (badge.condition(stats)) {
        const badgeRecord = {
          key: badge.key,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          earnedAt: Date.now()
        }

        store.badges.push(badgeRecord)
        awardedBadges.push(badgeRecord)
      }
    }

    if (awardedBadges.length > 0) {
      Store.save(store)
    }

    return awardedBadges
  }

  // 获取用户徽章列表
  getUserBadges() {
    const store = Store.get()
    return store.badges || []
  }

  // 获取所有徽章定义（含获得状态）
  getAllBadgesWithStatus(stats) {
    const userBadges = this.getUserBadges()
    const earnedKeys = new Set(userBadges.map(b => b.key))

    return Object.values(this.BADGE_DEFINITIONS).map(badge => ({
      ...badge,
      earned: earnedKeys.has(badge.key),
      earnedAt: userBadges.find(b => b.key === badge.key)?.earnedAt || null
    }))
  }

  // 获取已获得的徽章数量
  getEarnedCount() {
    return this.getUserBadges().length
  }

  // 获取总徽章数量
  getTotalCount() {
    return Object.keys(this.BADGE_DEFINITIONS).length
  }
}

// 单例导出
const badgeManager = new BadgeManager()
module.exports = badgeManager
