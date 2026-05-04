const Store = require('./store')

class CheckinManager {
  constructor() {
    this.CHECKIN_REWARD_BASE = 10
    this.CHECKIN_MILESTONES = {
      7: { reward: 50, badge: '坚持一周' },
      30: { reward: 200, badge: '月度达人' },
      100: { reward: 500, badge: '百日之光' }
    }
  }

  // 执行签到
  async doCheckin() {
    const today = this._getToday()
    const store = Store.get()

    if (!store.checkins) {
      store.checkins = []
    }

    // 检查今天是否已签到
    const todayCheckin = store.checkins.find(c => c.date === today)
    if (todayCheckin) {
      return {
        success: false,
        message: '今天已签到',
        streak: todayCheckin.streak
      }
    }

    // 计算连续天数
    const yesterday = this._getYesterday()
    const yesterdayCheckin = store.checkins.find(c => c.date === yesterday)
    const streak = yesterdayCheckin ? yesterdayCheckin.streak + 1 : 1

    // 计算奖励
    const reward = this._calculateReward(streak)

    // 记录签到
    const checkinRecord = {
      date: today,
      streak,
      reward,
      timestamp: Date.now()
    }

    store.checkins.push(checkinRecord)

    // 保持最近 365 条记录
    if (store.checkins.length > 365) {
      store.checkins = store.checkins.slice(-365)
    }

    Store.save(store)

    // 检查是否达到里程碑
    const milestone = this.CHECKIN_MILESTONES[streak]

    return {
      success: true,
      streak,
      reward,
      milestone: milestone || null,
      message: milestone ? `连续打卡 ${streak} 天，获得 ${milestone.badge} 徽章！` : `连续打卡 ${streak} 天，获得 ${reward} 次额度`
    }
  }

  // 获取连续天数
  getConsecutiveDays() {
    const store = Store.get()
    if (!store.checkins || store.checkins.length === 0) {
      return 0
    }

    // 按日期排序
    const sorted = [...store.checkins].sort((a, b) => b.date.localeCompare(a.date))
    const today = this._getToday()
    const yesterday = this._getYesterday()

    // 如果今天或昨天签到了，从最近一次开始计算
    const lastCheckin = sorted[0]
    if (lastCheckin.date !== today && lastCheckin.date !== yesterday) {
      return 0 // 断签超过 1 天
    }

    return lastCheckin.streak
  }

  // 获取本月打卡日历
  getMonthlyCheckins(year, month) {
    const store = Store.get()
    if (!store.checkins) return []

    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return store.checkins
      .filter(c => c.date.startsWith(prefix))
      .map(c => ({
        date: c.date,
        day: parseInt(c.date.split('-')[2]),
        streak: c.streak,
        reward: c.reward
      }))
  }

  // 计算奖励
  _calculateReward(streak) {
    if (this.CHECKIN_MILESTONES[streak]) {
      return this.CHECKIN_MILESTONES[streak].reward
    }
    return this.CHECKIN_REWARD_BASE + Math.floor(streak / 7) * 5
  }

  // 获取今天日期
  _getToday() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  // 获取昨天日期
  _getYesterday() {
    const now = new Date()
    now.setDate(now.getDate() - 1)
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
}

// 单例导出
const checkinManager = new CheckinManager()
module.exports = checkinManager
