import plugin from '../../lib/plugins/plugin.js'
import { execFile } from 'child_process'
import { segment } from 'oicq'
import { Common } from './common.js'   // ✅ 从同目录导入简化版 common.js
import fs from 'fs'                    // ✅ 新增
import path from 'path'                // ✅ 新增
import os from 'os'                    // ✅ 新增

export class ananDrawPlugin extends plugin {
  constructor() {
    super({
      name: '安安写画生成',
      dsc: '识别“安安写……”或带图/回复图片生成素描本图片（内存版）',
      event: 'message',
      priority: -114514,
      rule: [
        {
          reg: /^安安写(.{0,30})?$/,
          fnc: 'ananDraw'
        }
      ]
    })
    console.log('[ananDraw] ✅ 插件构造完成')
  }

  async ananDraw(e) {
    const scriptPath = `${process.cwd()}/plugins/anandraw-plugin/generate.py`
    console.log('[ananDraw] ✅ 开始处理消息')

    // === 获取所有图片（包括回复引用）
    const images = await Common.getImage(e)
    console.log(`[ananDraw] 🖼️ 获取图片数量: ${images.length}`)

    // === 有图 → 画图模式 ===
    if (images.length > 0) {
      const imgBuf = images[0]
      console.log('[ananDraw] 🎨 进入画图模式')

      // ✅ 写入临时文件
      const tmpPath = path.join(os.tmpdir(), `anan_${Date.now()}.png`)
      fs.writeFileSync(tmpPath, imgBuf)

      return new Promise((resolve) => {
        execFile(
          'python',
          [scriptPath, '--image', tmpPath],  // ✅ 传路径，不传 Base64
          {
            cwd: `${process.cwd()}/plugins/anandraw-plugin/`,
            maxBuffer: 20 * 1024 * 1024
          },
          async (err, stdout, stderr) => {
            if (err) {
              console.error('[ananDraw] ❌ 画图错误:', err, stderr)
              await e.reply('安安画画失败啦 QAQ')
              return resolve()
            }

            const base64 = stdout.toString().trim()
            if (!base64 || base64.startsWith('Error')) {
              await e.reply('安安好像忘了画图……')
              return resolve()
            }

            await e.reply(segment.image(Buffer.from(base64, 'base64')))
            console.log('[ananDraw] ✅ 图片已发送')

            // ✅ 删除临时文件
            try { fs.unlinkSync(tmpPath) } catch {}
            resolve()
          }
        )
      })
    }

    // === 没图 → 写字模式 ===
    const match = e.msg.match(/安安写(.+)/)
    const text = match ? match[1].trim() : ''
    if (!text) return e.reply('安安不知道要写什么喵')

    console.log(`[ananDraw] ✍️ 写字模式: ${text}`)
    return this.runPython(e, [scriptPath, text])
  }

  async runPython(e, args) {
    return new Promise((resolve) => {
      execFile(
        'python',
        args,
        {
          cwd: `${process.cwd()}/plugins/anandraw-plugin/`,
          maxBuffer: 20 * 1024 * 1024
        },
        async (err, stdout, stderr) => {
          if (err) {
            console.error('[ananDraw] ❌ Python执行出错：', err, stderr)
            await e.reply('安安画画失败啦 QAQ')
            return resolve()
          }

          const base64 = stdout.toString().trim()
          if (!base64 || base64.startsWith('Error')) {
            await e.reply('安安忘记画图了……')
            return resolve()
          }

          await e.reply(segment.image(Buffer.from(base64, 'base64')))
          console.log('[ananDraw] ✅ 图片已发送')
          resolve()
        }
      )
    })
  }
}
