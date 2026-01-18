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
      dsc: '发送随机图片，并在收到 “上传睦头/木头/人机/入机” + 图片 时保存到 ruji 文件夹',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: -1145141919,
      rule: [
        {
          reg: "^#?随机(睦头|木头|人机|入机)$",
          fnc: 'randomimg'
        },
        {
          reg: "^[/#]?(.*)上传(睦头|木头|人机|入机).*$",
          fnc: 'saveImage'
        }
      ]
    });
  }

  async randomimg(e){
    const path = process.cwd() + '/resources/ruji/';
    const files = fs.readdirSync(path);
    const imageFiles = files.filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.gif'));
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    const imagePath = `${path}/${imageFiles[randomIndex]}`;
    const img = fs.readFileSync(imagePath);
    await this.reply(segment.image(img));
    }

   // 上传识别逻辑
  async saveImage(e) {
    // 1. 如果当前消息本身带有图片
    if (!e.img) {
      // 1a. 回复带图消息后发“上传XXX”，从 e.source 拉取上一条消息
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
              const url = seg.url || seg.data?.url;
              if (url) {
                e.img = [url];
                break;
              }
            }
          }
        }
      }
      // 1b. 引用带图消息后发“上传XXX”，从 e.reply_id 拉取被引用消息
      if (!e.img && e.reply_id) {
        const repliedObj = await e.getReply(e.reply_id);
        const replied = repliedObj?.message;
        if (Array.isArray(replied)) {
          for (const seg of replied) {
            if (seg.type === 'image') {
              const url = seg.url || seg.data?.url;
              if (url) {
                e.img = [url];
                break;
              }
            }
          }
        }
      }
    }

    // 2. 如果到这里 e.img 仍然为空，说明没拿到图片
    if (!e.img || !Array.isArray(e.img) || !e.img[0]) {
      return e.reply('小乞检测不到图片QAQ');
    }

    // 3. 若已拿到图片 URL，就去下载并保存
    return this._downloadAndSave(e);
    }

  // 通用下载并保存到 resources/ruji/，并根据 content-type 保留原始格式
  async _downloadAndSave(e) {
    const folder = process.cwd() + '/resources/ruji/';
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
      // 根据响应头中的 content-type 来决定文件后缀
      const contentType = resp.headers.get('content-type') || '';
      let ext = '.jpg';
      if (contentType.includes('gif')) {
        ext = '.gif';
      } else if (contentType.includes('png')) {
        ext = '.png';
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        ext = '.jpg';
      } else if (contentType.includes('webp')) {
        ext = '.webp';
      }

      // node-fetch v3 使用 arrayBuffer() → Buffer.from(...)
      const arrayBuf = await resp.arrayBuffer();
      const buf = Buffer.from(arrayBuf);

      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
      const savePath = `${folder}/${fileName}`;
      fs.writeFileSync(savePath, buf);
      return e.reply('主人，图片被好好记住啦');
    } catch (err) {
      console.error('图片记忆出错啦：', err);
      return e.reply('保存图片时出错，请查看后台日志');
    }
  }
}