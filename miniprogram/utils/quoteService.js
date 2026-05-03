// ====== API Config Manager ======
const API_CONFIG_KEY = 'glimmer_api_config'
const QUOTA_KEY = 'glimmer_quota'

const ApiConfig = {
  data: { key: null, model: 'qwen-turbo', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },

  load() {
    try {
      const raw = wx.getStorageSync(API_CONFIG_KEY)
      if (raw) this.data = JSON.parse(raw)
    } catch (e) {}
    return this.data
  },

  save(config) {
    this.data = { ...this.data, ...config }
    wx.setStorageSync(API_CONFIG_KEY, JSON.stringify(this.data))
  },

  isConfigured() {
    return !!this.data.key && this.data.key.length > 10
  },

  getKey() { return this.data.key },
  getModel() { return this.data.model },
  getBaseUrl() { return this.data.baseUrl }
}

// ====== Quota Manager ======
const QuotaManager = {
  maxDaily: 100,

  check() {
    const today = new Date().toISOString().slice(0, 10)
    let quota
    try { quota = wx.getStorageSync(QUOTA_KEY) || { date: today, used: 0 } } catch (e) { quota = { date: today, used: 0 } }

    if (quota.date !== today) {
      quota = { date: today, used: 0 }
      wx.setStorageSync(QUOTA_KEY, JSON.stringify(quota))
    }
    return quota.used < this.maxDaily
  },

  increment() {
    const today = new Date().toISOString().slice(0, 10)
    let quota
    try { quota = wx.getStorageSync(QUOTA_KEY) || { date: today, used: 0 } } catch (e) { quota = { date: today, used: 0 } }
    if (quota.date !== today) quota = { date: today, used: 0 }
    quota.used++
    wx.setStorageSync(QUOTA_KEY, JSON.stringify(quota))
    return quota.used
  },

  getUsed() {
    const today = new Date().toISOString().slice(0, 10)
    try {
      const quota = wx.getStorageSync(QUOTA_KEY) || { date: today, used: 0 }
      return quota.date === today ? quota.used : 0
    } catch (e) { return 0 }
  }
}

// ====== Quote Cache ======
const CACHE_KEY = 'glimmer_cache'
const HISTORY_KEY = 'glimmer_history'
const MAX_CACHE = 50
const MAX_HISTORY = 200
const SIMILARITY_THRESHOLD = 0.8
const COOLDOWN_DURATION_MS = 30 * 60 * 1000
const COOLDOWN_FAILURE_COUNT = 3

const QuoteCache = {
  getCache() {
    try { return JSON.parse(wx.getStorageSync(CACHE_KEY)) || [] } catch (e) { return [] }
  },

  saveCache(list) {
    // Keep newest entries (slice from end)
    if (list.length > MAX_CACHE) list = list.slice(-MAX_CACHE)
    wx.setStorageSync(CACHE_KEY, JSON.stringify(list))
  },

  addHistory(text) {
    try {
      let hist = JSON.parse(wx.getStorageSync(HISTORY_KEY)) || []
      hist.push(text)
      if (hist.length > MAX_HISTORY) hist = hist.slice(-MAX_HISTORY)
      wx.setStorageSync(HISTORY_KEY, JSON.stringify(hist))
    } catch (e) {}
  },

  isShown(text) {
    try {
      const hist = JSON.parse(wx.getStorageSync(HISTORY_KEY)) || []
      return hist.some(h => this.similarity(h, text) > SIMILARITY_THRESHOLD)
    } catch (e) { return false }
  },

  similarity(a, b) {
    if (!a || !b) return 0
    const longer = a.length > b.length ? a : b
    const shorter = a.length > b.length ? b : a
    if (longer.length === 0) return 1
    const costs = []
    for (let i = 0; i <= shorter.length; i++) {
      let last = i
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) costs[j] = j
        else if (j === 0) costs[j] = last
        else {
          const tmp = costs[j]
          costs[j] = Math.min(costs[j - 1] + 1, last + 1, last + (shorter[i - 1] === longer[j - 1] ? 0 : 1))
          last = tmp
        }
      }
    }
    return 1 - costs[longer.length] / longer.length
  }
}

// ====== Quote Generator ======
const QuoteGenerator = {
  categories: [
    { name: '哲学', category: 'philosophy', badge: '哲思之光' },
    { name: '心理学', category: 'psychology', badge: '心光' },
    { name: '反常识', category: 'counterintuitive', badge: '逆光' },
    { name: '励志', category: 'literature', badge: '晨曦之光' }
  ],

  buildPrompt() {
    const cat = this.categories[Math.floor(Math.random() * this.categories.length)]
    return `你是一位资深文学编辑和哲学思想家。请生成一条高质量的金句语录。

要求：
1. 类别：${cat.name}
2. 中文内容（30-80字，精炼有力，有思想深度）
3. 英文翻译（准确优美）
4. 出处（真实存在的书籍、电影或演讲）
5. 作者（真实人物）
6. 背景上下文（50字内）
7. 标签（如 #希望、#勇气、#自由）

请严格按以下 JSON 格式返回，不要包含任何其他文字：
{"zh":"中文内容","en":"English translation","source":"出处","author":"作者","context":"背景","tag":"#标签"}

确保内容原创或来自经典文献，质量要高，有启发性和共鸣感。`
  },

  async generate() {
    const config = ApiConfig.load()
    if (!config.key) throw new Error('未配置 API Key')
    if (!QuotaManager.check()) throw new Error('今日额度已用完')

    return new Promise((resolve, reject) => {
      wx.request({
        url: config.baseUrl + '/chat/completions',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + config.key
        },
        data: {
          model: config.model,
          messages: [{ role: 'user', content: this.buildPrompt() }],
          temperature: 0.9,
          max_tokens: 500
        },
        success(res) {
          if (res.statusCode === 200 && res.data.choices && res.data.choices[0]) {
            const raw = res.data.choices[0].message.content.trim()
            // Use [\s\S]*? to match nested JSON objects (not [^}]+)
            const jsonMatch = raw.match(/\{[\s\S]*\}/)
            if (!jsonMatch) return reject(new Error('返回格式不正确'))

            try {
              const parsed = JSON.parse(jsonMatch[0])
              if (!parsed.zh || !parsed.en) return reject(new Error('内容不完整'))

              if (QuoteCache.isShown(parsed.zh)) {
                return reject(new Error('重复内容'))
              }

              QuoteCache.addHistory(parsed.zh)
              QuotaManager.increment()

              const cat = QuoteGenerator.categories.find(c => c.name === (parsed.category || '')) ||
                QuoteGenerator.categories[Math.floor(Math.random() * QuoteGenerator.categories.length)]

              resolve({
                id: 'llm_' + Date.now(),
                zh: parsed.zh,
                en: parsed.en,
                source: parsed.source || '佚名',
                author: parsed.author || '',
                context: parsed.context || '',
                tag: parsed.tag || '#微光',
                category: parsed.category || cat.category,
                badge: parsed.badge || cat.badge,
                isLLM: true
              })
            } catch (e) {
              reject(new Error('JSON 解析失败'))
            }
          } else {
            reject(new Error(res.data?.error?.message || 'API 请求失败'))
          }
        },
        fail(err) { reject(new Error(err.errMsg || '网络错误')) }
      })
    })
  }
}

// ====== Quote Router ======
const QuoteRouter = {
  cooldownUntil: 0,
  consecutiveFailures: 0,

  async getNextQuote(appQuotes) {
    if (Date.now() < this.cooldownUntil) {
      return this.getFallbackQuote(appQuotes)
    }

    // Try cache first
    const cached = QuoteCache.getCache()
    if (cached.length > 0) {
      const quote = cached.shift()
      QuoteCache.saveCache(cached)
      this.consecutiveFailures = 0
      return { ...quote, isLLM: true }
    }

    // Try LLM generation
    try {
      const quote = await QuoteGenerator.generate()
      this.consecutiveFailures = 0

      // Preload: generate 2-3 more in background (queued)
      this._preloadIfNeeded(appQuotes)

      return quote
    } catch (e) {
      this.consecutiveFailures++
      if (this.consecutiveFailures >= COOLDOWN_FAILURE_COUNT) {
        this.cooldownUntil = Date.now() + COOLDOWN_DURATION_MS
      }
      return this.getFallbackQuote(appQuotes)
    }
  },

  _preloadIfNeeded(appQuotes) {
    const cached = QuoteCache.getCache()
    if (cached.length < 3 && ApiConfig.isConfigured()) {
      // Generate one and add to cache
      QuoteGenerator.generate()
        .then(q => {
          const list = QuoteCache.getCache()
          list.push(q)
          QuoteCache.saveCache(list)
        })
        .catch(() => {})
    }
  },

  getFallbackQuote(appQuotes) {
    const len = appQuotes.length
    const idx = Math.floor(Math.random() * len)
    return appQuotes[idx]
  },

  async preloadQuotes(appQuotes, count = 3) {
    if (!ApiConfig.isConfigured()) return
    let cached = QuoteCache.getCache()
    if (cached.length >= count) return

    for (let i = 0; i < count - cached.length; i++) {
      try {
        const q = await QuoteGenerator.generate()
        cached = [...cached, q]
      } catch (e) { break }
    }
    QuoteCache.saveCache(cached)
  }
}

module.exports = {
  ApiConfig,
  QuotaManager,
  QuoteCache,
  QuoteGenerator,
  QuoteRouter
}
