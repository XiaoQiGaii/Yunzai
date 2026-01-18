import plugin from '../../lib/plugins/plugin.js';
import fetch from "node-fetch";
import { segment } from 'oicq';
import fs from 'fs';
export class example extends plugin {
  constructor() {
    super({
	  /** 功能名称 */
      name: '随机图片和保存图片',
      /** 功能描述 */
      dsc: '发送随机图片，并在收到 “上传群友/变态” + 图片 时保存到 qunyou 文件夹',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: -1145141919,
      rule: [
        {
          reg: "^#?随机(杂鱼|史官)$",
          fnc: 'randomimg'
        },
        {
          reg: "^[/#]?(.*)上传(杂鱼|史官).*$",
          fnc: 'saveImage'
        }
      ]
    });
  }

  async randomimg(e){
    const path = process.cwd() + '/resources/zako/';
    const files = fs.readdirSync(path);
    const imageFiles = files.filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    const imagePath = `${path}/${imageFiles[randomIndex]}`;
    const img = fs.readFileSync(imagePath);
    await this.reply(segment.image(img));
  }

   // 上传识别逻辑
  async saveImage(e) {
    // 1. 如果消息本身带图，直接使用；否则尝试从 source 或 reply_id 拿
    if (!e.img) {
      // 1a. 回复带图后发“上传xqg”，从 e.source 取
      if (e.source) {
        let replySegs;
        if (e.isGroup) {
          replySegs = (await e.group.getChatHistory(e.source.seq, 1))
                        .pop()?.message;
        } else {
          replySegs = (await e.friend.getChatHistory(e.source.time, 1))
                        .pop()?.message;
        }
        if (replySegs) {
          for (const seg of replySegs) {
            if (seg.type === 'image') {
              // 兼顾两种结构：seg.url 或 seg.data.url
              e.img = [ seg.url || seg.data?.url ].filter(u => u)[0] ? [seg.url || seg.data?.url] : undefined;
              if (e.img) break;
            }
          }
        }
      }
      // 1b. 引用带图后发“上传xqg”，从 e.reply_id 取
      if (!e.img && e.reply_id) {
        const repliedObj = await e.getReply(e.reply_id);
        const replied = repliedObj?.message;
        if (Array.isArray(replied)) {
          for (const seg of replied) {
            if (seg.type === 'image') {
              e.img = [ seg.url || seg.data?.url ].filter(u => u)[0] ? [seg.url || seg.data?.url] : undefined;
              if (e.img) break;
            }
          }
        }
      }
    }

    // 2. 如果到这里 e.img 仍为空，直接返回错误
    if (!e.img || !Array.isArray(e.img) || !e.img[0]) {
      return e.reply('小乞检测不到图片QAQ');
    }

    // 3. e.img 非空，执行下载保存
    return this._downloadAndSave(e);
  }

  // 通用下载并保存到 resources/qunyou/ 的逻辑
  async _downloadAndSave(e) {
    const folder = process.cwd() + '/resources/zako/';
    try {
      fs.accessSync(folder);
    } catch {
      try {
        fs.mkdirSync(folder, { recursive: true });
      } catch {
        return e.reply('无法创建保存目录，请检查权限');
      }
    }

    // 只取第一张图片 URL
    const imgUrl = Array.isArray(e.img) ? e.img[0] : e.img;
    try {
      const resp = await fetch(imgUrl);
      if (!resp.ok) {
        return e.reply('图片下载失败，请稍后重试喵');
      }
      // node-fetch v3 使用 arrayBuffer() → Buffer.from(...)
      const arrayBuf = await resp.arrayBuffer();
      const buf = Buffer.from(arrayBuf);

      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
      const savePath = `${folder}/${fileName}`;
      fs.writeFileSync(savePath, buf);
      return e.reply(`主人，图片被好好记住啦`);
    } catch (err) {
      console.error('图片记忆出错啦：', err);
      return e.reply('保存图片时出错，请查看后台日志');
    }
  }
}