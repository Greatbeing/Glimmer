class ShareCardGenerator {
  constructor() {
    this.canvasId = 'shareCanvas'
    this.cardWidth = 600
    this.cardHeight = 800 // 4:5 竖版比例
  }

  // 生成语录卡片
  async generateQuoteCard(quote, userInfo, options = {}) {
    const {
      mode = 'portrait', // 'portrait' (4:5) or 'landscape' (16:9)
      showQRCode = true
    } = options

    // 设置卡片尺寸
    if (mode === 'landscape') {
      this.cardWidth = 800
      this.cardHeight = 450
    } else {
      this.cardWidth = 600
      this.cardHeight = 800
    }

    const ctx = wx.createCanvasContext(this.canvasId)

    // 绘制背景
    this._drawBackground(ctx)

    // 绘制装饰光晕
    this._drawGlow(ctx)

    // 绘制语录内容
    await this._drawQuote(ctx, quote, mode)

    // 绘制来源信息
    this._drawSource(ctx, quote)

    // 绘制底部品牌信息
    this._drawBranding(ctx, showQRCode)

    // 绘制完成
    return new Promise((resolve, reject) => {
      ctx.draw(false, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId: this.canvasId,
            x: 0,
            y: 0,
            width: this.cardWidth,
            height: this.cardHeight,
            destWidth: this.cardWidth * 2,
            destHeight: this.cardHeight * 2,
            fileType: 'png',
            quality: 1,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          })
        }, 500)
      })
    })
  }

  // 绘制背景
  _drawBackground(ctx) {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, this.cardWidth, this.cardHeight)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.5, '#1e1b4b')
    gradient.addColorStop(1, '#312e81')
    ctx.setFillStyle(gradient)
    ctx.fillRect(0, 0, this.cardWidth, this.cardHeight)
  }

  // 绘制装饰光晕
  _drawGlow(ctx) {
    ctx.save()
    ctx.setGlobalAlpha(0.15)
    ctx.setFillStyle('#f59e0b')
    ctx.beginPath()
    ctx.arc(this.cardWidth * 0.8, this.cardHeight * 0.2, 100, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  }

  // 绘制语录内容
  async _drawQuote(ctx, quote, mode) {
    const padding = 40
    const maxWidth = this.cardWidth - padding * 2
    let y = mode === 'portrait' ? 100 : 80

    // 绘制徽章
    const badge = quote.badge || '晨曦之光'
    ctx.save()
    ctx.setGlobalAlpha(0.2)
    ctx.setFillStyle('#fbbf24')
    const badgeWidth = this._measureText(ctx, badge, 14) + 30
    this._drawRoundRect(ctx, padding, y, badgeWidth, 28, 14)
    ctx.fill()
    ctx.restore()

    ctx.setFillStyle('#fbbf24')
    ctx.setFontSize(14)
    ctx.fillText(badge, padding + 15, y + 19)
    y += 50

    // 绘制中文语录
    const zhText = `"${quote.zh}"`
    const zhLines = this._wrapText(ctx, zhText, 24, maxWidth)
    ctx.setFillStyle('#fffbf7')
    ctx.setFontSize(24)
    ctx.setTextAlign('left')

    for (const line of zhLines) {
      ctx.fillText(line, padding, y)
      y += 36
    }

    y += 20

    // 绘制英文语录（如果有）
    if (quote.en) {
      const enLines = this._wrapText(ctx, quote.en, 16, maxWidth)
      ctx.setFillStyle('#9ca3af')
      ctx.setFontSize(16)
      ctx.setFontStyle('italic')

      for (const line of enLines) {
        ctx.fillText(line, padding + 12, y)
        y += 24
      }
    }

    return y
  }

  // 绘制来源信息
  _drawSource(ctx, quote) {
    const padding = 40
    let y = this.cardHeight - (quote.en ? 180 : 140)

    ctx.setFillStyle('#fde68a')
    ctx.setFontSize(16)
    ctx.setTextAlign('left')

    const sourceText = `——《${quote.source}》`
    ctx.fillText(sourceText, padding, y)
    y += 28

    if (quote.author) {
      ctx.setFillStyle('#9ca3af')
      ctx.setFontSize(14)
      ctx.fillText(`作者：${quote.author}`, padding, y)
    }

    if (quote.tag) {
      const tagY = this.cardHeight - 100
      ctx.save()
      ctx.setGlobalAlpha(0.15)
      ctx.setFillStyle('#fde68a')
      const tagWidth = this._measureText(ctx, quote.tag, 12) + 20
      this._drawRoundRect(ctx, padding, tagY, tagWidth, 22, 4)
      ctx.fill()
      ctx.restore()

      ctx.setFillStyle('#fde68a')
      ctx.setFontSize(12)
      ctx.fillText(quote.tag, padding + 10, tagY + 15)
    }
  }

  // 绘制品牌信息
  _drawBranding(ctx, showQRCode) {
    const padding = 40
    const y = this.cardHeight - 70

    // 分隔线
    ctx.setStrokeStyle('rgba(255,255,255,0.1)')
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(padding, y - 20)
    ctx.lineTo(this.cardWidth - padding, y - 20)
    ctx.stroke()

    // Logo 和 Slogan
    ctx.setFillStyle('#fef3c7')
    ctx.setFontSize(18)
    ctx.setTextAlign('left')
    ctx.fillText('Glimmer 微光', padding, y)

    ctx.setFillStyle('#9ca3af')
    ctx.setFontSize(12)
    ctx.fillText('每日微光，照亮心房', padding, y + 22)

    // 二维码占位（实际应用中需要调用云函数生成小程序码）
    if (showQRCode) {
      const qrSize = 50
      const qrX = this.cardWidth - padding - qrSize
      const qrY = y - 10

      ctx.save()
      ctx.setGlobalAlpha(0.8)
      ctx.setFillStyle('#fff')
      this._drawRoundRect(ctx, qrX, qrY, qrSize, qrSize, 6)
      ctx.fill()
      ctx.restore()

      ctx.setFillStyle('#0f172a')
      ctx.setFontSize(10)
      ctx.setTextAlign('center')
      ctx.fillText('扫码', qrX + qrSize / 2, qrY + qrSize / 2 + 4)
    }
  }

  // 生成邀请卡片
  async generateInviteCard(inviteCode, userInfo) {
    const ctx = wx.createCanvasContext(this.canvasId)
    this.cardWidth = 600
    this.cardHeight = 800

    // 背景
    this._drawBackground(ctx)
    this._drawGlow(ctx)

    const padding = 40
    let y = 150

    // 标题
    ctx.setFillStyle('#fef3c7')
    ctx.setFontSize(28)
    ctx.setTextAlign('center')
    ctx.fillText('Glimmer 微光', this.cardWidth / 2, y)
    y += 30

    ctx.setFillStyle('#9ca3af')
    ctx.setFontSize(16)
    ctx.fillText('每日微光，照亮心房', this.cardWidth / 2, y)
    y += 80

    // 邀请信息
    ctx.setFillStyle('#fbbf24')
    ctx.setFontSize(20)
    ctx.fillText('邀请你一起捕捉微光', this.cardWidth / 2, y)
    y += 60

    // 邀请码
    ctx.save()
    ctx.setGlobalAlpha(0.2)
    ctx.setFillStyle('#fbbf24')
    const codeWidth = this._measureText(ctx, inviteCode, 48) + 60
    this._drawRoundRect(ctx, (this.cardWidth - codeWidth) / 2, y - 30, codeWidth, 70, 12)
    ctx.fill()
    ctx.restore()

    ctx.setFillStyle('#fbbf24')
    ctx.setFontSize(48)
    ctx.setFontWeight('bold')
    ctx.fillText(inviteCode, this.cardWidth / 2, y + 15)
    y += 80

    ctx.setFillStyle('#9ca3af')
    ctx.setFontSize(14)
    ctx.fillText('注册后双方各得 50 次 LLM 额度', this.cardWidth / 2, y)
    y += 100

    // 用户头像占位
    ctx.save()
    ctx.setGlobalAlpha(0.3)
    ctx.setFillStyle('#f59e0b')
    ctx.beginPath()
    ctx.arc(this.cardWidth / 2, y, 40, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()

    if (userInfo && userInfo.nickname) {
      ctx.setFillStyle('#fef3c7')
      ctx.setFontSize(16)
      ctx.fillText(`${userInfo.nickname} 邀请`, this.cardWidth / 2, y + 60)
    }

    // 底部提示
    ctx.setFillStyle('#6b7280')
    ctx.setFontSize(12)
    ctx.fillText('长按识别二维码', this.cardWidth / 2, this.cardHeight - 80)

    return new Promise((resolve, reject) => {
      ctx.draw(false, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId: this.canvasId,
            x: 0,
            y: 0,
            width: this.cardWidth,
            height: this.cardHeight,
            destWidth: this.cardWidth * 2,
            destHeight: this.cardHeight * 2,
            fileType: 'png',
            quality: 1,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          })
        }, 500)
      })
    })
  }

  // 辅助方法：测量文字宽度
  _measureText(ctx, text, fontSize) {
    ctx.setFontSize(fontSize)
    const metrics = ctx.measureText(text)
    return metrics ? metrics.width : text.length * fontSize
  }

  // 辅助方法：文字换行
  _wrapText(ctx, text, fontSize, maxWidth) {
    ctx.setFontSize(fontSize)
    const lines = []
    let currentLine = ''

    for (const char of text) {
      const testLine = currentLine + char
      const width = this._measureText(ctx, testLine, fontSize)
      if (width > maxWidth) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)
    return lines
  }

  // 辅助方法：绘制圆角矩形
  _drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.arcTo(x + width, y, x + width, y + radius, radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
    ctx.lineTo(x + radius, y + height)
    ctx.arcTo(x, y + height, x, y + height - radius, radius)
    ctx.lineTo(x, y + radius)
    ctx.arcTo(x, y, x + radius, y, radius)
    ctx.closePath()
  }

  // 分享卡片到微信
  async shareCard(imagePath, shareType = 'friend') {
    if (shareType === 'friend') {
      wx.shareAppMessage({
        title: 'Glimmer 微光 - 每日微光，照亮心房',
        imageUrl: imagePath,
        path: '/pages/index/index'
      })
    } else if (shareType === 'timeline') {
      // 分享到朋友圈需要特殊处理
      wx.showToast({ title: '请长按图片保存后分享', icon: 'none' })
    }
  }

  // 保存图片到相册
  async saveToAlbum(imagePath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath: imagePath,
        success: () => {
          wx.showToast({ title: '已保存到相册', icon: 'success' })
          resolve()
        },
        fail: reject
      })
    })
  }
}

// 单例导出
const shareCardGenerator = new ShareCardGenerator()
module.exports = shareCardGenerator
