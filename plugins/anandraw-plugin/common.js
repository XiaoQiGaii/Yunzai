import fetch from 'node-fetch'

export const Common = {
  /**
   * 获取消息或引用消息中的所有图片
   * @param {object} e - 消息事件对象
   * @returns {Promise<Buffer[]>} - 图片的 Buffer 数组
   */
  async getImage(e) {
    const imageUrls = []

    // 1️⃣ 获取当前消息里的图片
    if (e.message) {
      const imgs = e.message.filter(m => m.type === 'image').map(m => m.url)
      imageUrls.push(...imgs)
    }

    // 2️⃣ 如果没有图片，尝试从引用消息中获取
    if (imageUrls.length === 0 && e.reply_id) {
      try {
        const reply = await e.getReply()
        if (reply?.message) {
          const replyImgs = reply.message.filter(m => m.type === 'image').map(m => m.url)
          imageUrls.push(...replyImgs)
        }
      } catch (err) {
        console.warn('[Common] ⚠️ 获取引用消息失败：', err)
      }
    }

    console.log(`[Common] 📸 获取到 ${imageUrls.length} 张图片`)

    // 3️⃣ 下载图片为 Buffer
    const buffers = []
    for (const url of imageUrls) {
      try {
        const resp = await fetch(url)
        const buf = Buffer.from(await resp.arrayBuffer())
        buffers.push(buf)
      } catch (err) {
        console.error('[Common] ❌ 图片下载失败：', url, err)
      }
    }

    return buffers
  },

  /**
   * 获取单张图片的 Base64
   * @param {string} url - 图片 URL
   * @returns {Promise<string>} Base64 字符串（不带前缀）
   */
  async getImageBase64(url) {
    try {
      const resp = await fetch(url)
      const buf = Buffer.from(await resp.arrayBuffer())
      return buf.toString('base64')
    } catch (err) {
      console.error('[Common] ❌ getImageBase64 失败：', err)
      return ''
    }
  }
}
