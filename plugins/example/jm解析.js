import plugin from '../../lib/plugins/plugin.js';
import { segment } from 'oicq';
import fs from 'fs';
import { exec } from 'child_process';


// 等待文件生成的函数，timeout 单位毫秒，interval 每次检测间隔
function waitForFile(filePath, timeout = 30000, interval = 1000) {
  return new Promise((resolve, reject) => {
    let elapsed = 0;
    const timer = setInterval(() => {
      if (fs.existsSync(filePath)) {
        console.log(`文件已生成: ${filePath}`);
        clearInterval(timer);
        resolve(true);
      }
      elapsed += interval;
      if (elapsed >= timeout) {
        clearInterval(timer);
        reject(new Error('等待文件超时'));
      }
    }, interval);
  });
}

function isAlbumNotFound(text) {
  if (!text) return false;
  const s = String(text);
  return /MissingAlbumPhotoException/i.test(s) || /请求的本子不存在/.test(s);
}

function isSettingNoise(text) {
  if (!text) return false;
  const s = String(text);
  return /无法解析jm车号, 文本为: \/setting/.test(s);
}

export class pdfSender extends plugin {
  constructor() {
    super({
      name: 'PDF发送插件',
      dsc: '接收到jm+6或7位数字时执行命令生成PDF并发送',
      event: 'message',
      priority: -1145141919,
      rule: [
        {
          // 匹配 jm 开头，后面跟着3-10位数字
          reg: "^(jm|JM|Jm)(\\d{2,9})$",
          fnc: 'sendPdf'
        }
      ]
    });
  }

  async sendPdf(e) {
    // 从消息中获取数字，忽略 jm 的大小写
    const match = e.msg.match(/^jm(\d{2,9})$/i);
    if (!match) return;
    const num = match[1];

    if (num == 350234 || num == 350235)
    {
      await this.reply("再发董卓我TM找人弄你")
      return;
    }

    // 回复提示语
    await this.reply("正在寻找本子喵，请耐心~");

    // 指定option文件的路径
    const optionPath = 'E:\\GHS\\18comic_down\\option.yml';
    // 构造外部命令
    const cmd = `set PYTHONIOENCODING=utf-8 && jmcomic ${num} --option="${optionPath}"`;

    // 执行命令
    exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, async (error, stdout, stderr) => {
      if (error) {
        console.log(`jmcomic error: ${error.message}`);
      }

      const combined = `${stdout || ''}\n${stderr || ''}`;
      if (isAlbumNotFound(combined)) {
        await this.reply('这神秘数字…………根本找不到这本啊，羊咩的你是不是在耍我喵？不要浪费我宝贵的运行内存知道了喵？');
        return;
      }

      if (stderr) {
        console.log('================ jmcomic stderr ================');
        console.log('[jmcomic stderr]', stderr);
        console.log('================================================');
        // 可以根据需要选择是否继续执行
      }

      // 构造生成的PDF文件路径（假设生成的PDF与数字同名保存在同一目录下）
      const pdfPath = `E:\\GHS\\18comic_down\\PDFs\\${num}.pdf`;

      try {
        // 等待 PDF 文件生成，最大等待时间 30 秒，每 1 秒检测一次
        await waitForFile(pdfPath, 30000, 1000);
        const pdfBuffer = fs.readFileSync(pdfPath);
        // 发送 PDF 文件
        console.log(`发送本子: ${num}.pdf`);
        this.reply(segment.file(pdfBuffer, `${num}.pdf`));
      } catch (err) {
        // 超时或者出错时发送提示消息
        this.reply("本子下载失败喵，请主人惩罚TAT");
      }
    });
  }
}
