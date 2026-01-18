/**
 * 介绍：随机发送一张沙雕图，图库在https://gitee.com/bling_yshs/ys-dio-pic-repo，下载后放入yunzai-bot/data/ys-dio-pic下，也就是会得到yunzai-bot/data/ys-dio-pic/abc.image
 * 样例：吊图
 * 样例(回复一张图片时)：添加吊图
 * 样例(回复一张图片时)：删除吊图
 */
import plugin from '../../lib/plugins/plugin.js'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

// 检查是否有data/ys-dio-pic文件夹，没有则创建
let dioDir = './data/ys-dio-pic'
if (!fs.existsSync(dioDir)) {
  fs.mkdirSync(dioDir)
}
// 检查是否有data/ys-old文件夹，没有则创建
let oldDir = './data/ys-old'
if (!fs.existsSync(oldDir)) {
  fs.mkdirSync(oldDir)
}

export class example extends plugin {
  constructor () {
    super({
      name: 'ys-沙雕图-reborn',
      dsc: 'ys-沙雕图-reborn',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '^#?(弔图|吊图|沙雕图)$', fnc: 'sendDio'
      }, {
        reg: '^#?添加(弔图|吊图|沙雕图)', fnc: 'addDio'
      }, {
        reg: '^#?删除(弔图|吊图|沙雕图)', fnc: 'delDio'
      }, {
        reg: '^#?审查(弔图|吊图|沙雕图)', fnc: 'checkDio'
      }, {
        reg: '^#?(弔图|吊图|沙雕图)(十连|10连)$', fnc: 'sendDioTen'
      }, {
        reg: '^#?这是什么(弔图|吊图|沙雕图)', fnc: 'whatDio'
      }]
    })
  }

  async sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async checkDio (e) {
    if (!e.isMaster) {
      e.reply('只有主人才能审查')
      return
    }

    // 检查消息里是否存在日期
    let message = e.raw_message
    let dateReg = /\d{4}.\d{1,2}.\d{1,2}$/
    let dateMatch = message.match(dateReg)
    let date

    if (dateMatch) {
      // 如果用户输入了日期，就使用用户输入的
      date = dateMatch[0]
    } else {
      // 如果用户没输入日期，就使用上次记录的时间
      date = await redis.get('ys:checkDio:lastDate')
      if (!date) {
        e.reply('首次使用请在消息结尾添加日期，格式为2024.5.23')
        return
      }
    }

    // 存入临时redis用于查询
    await redis.set('ys:checkDio:date', date)

    // 从dioDir中找到目标日期以后的图片，计算数量和总大小（单位MB），询问用户是否需要继续审查
    let files = fs.readdirSync(dioDir)
    let targetDate = new Date(date)

    files = files.filter(file => {
      let stats = fs.statSync(path.join(dioDir, file))
      return stats.mtime > targetDate
    })
    let totalSize = 0
    for (let file of files) {
      let stats = fs.statSync(path.join(dioDir, file))
      totalSize += stats.size
    }
    let totalSizeMB = totalSize / 1024 / 1024
    // 格式化日期为 YYYY-MM-DD
    let formattedDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`
    e.reply(`即将审查 ${formattedDate} 至今的所有吊图，共有 ${files.length} 张图片，总大小为 ${totalSizeMB.toFixed(2)} MB，是否继续审查？(是/否)`)
    this.setContext('confirmCheckDio')
  }

  async confirmCheckDio () {
    let message = this.e.raw_message
    if (message === '是') {
      this.finish('confirmCheckDio')
      Bot.logger.info('开始制作消息')

      // 将当前时间存入redis作为下次审查的起始时间
      let now = new Date()
      let currentDate = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`
      await redis.set('ys:checkDio:lastDate', currentDate)

      // 使用本次查询的日期
      let date = await redis.get('ys:checkDio:date')
      let targetDate = new Date(date)
      let files = fs.readdirSync(dioDir)
      files = files.filter(file => {
        let stats = fs.statSync(path.join(dioDir, file))
        return stats.isFile() && stats.mtime > targetDate
      })
      let msgList = []
      let count = 0
      for (let file of files) {
        count++
        let filePath = path.join(dioDir, file)
        msgList.push({
          user_id: Bot.uin, message: [file, segment.image(filePath)]
        })
        if (count % 10 === 0) {
          this.e.reply(await Bot[Bot.uin].makeForwardMsg(msgList))
          msgList = []
          await this.sleep(1000)
        }
      }
      if (msgList.length > 0) {
        this.e.reply(await Bot[Bot.uin].makeForwardMsg(msgList))
      }
      Bot.logger.info('消息制作完成')
    } else if (message === '否') {
      this.e.reply('已取消审查')
      this.finish('confirmCheckDio')
    } else {
      this.reply('请回复是或否')
    }
  }

  async sendDio (e) {
    // 获取用户QQ号
    const userId = e.user_id
    const cdKey = `ys:sendDio:cd:${userId}`

    // 检查次数
    let count = await redis.get(cdKey) || 0
    if (count >= 3) {
      // 获取剩余CD时间
      let ttl = await redis.ttl(cdKey)
      let seconds = Math.ceil(ttl)
      e.reply(`1分钟最多只能看3张吊图哦~\n请等待${seconds}秒后再试`)
      return
    }

    // 检查文件夹是否存在图片
    let dioPicList = fs.readdirSync(dioDir)
    if (dioPicList.length === 0) {
      e.reply('沙雕图文件夹为空，请执行以下命令获取图片:\ngit clone --depth=1 https://gitee.com/bling_yshs/ys-dio-pic-repo.git ./data/ys-dio-pic')
      return
    }

    // 随机发送一张图片
    let dioTuPath = path.join(dioDir, dioPicList[Math.floor(Math.random() * dioPicList.length)])
    e.reply(segment.image(dioTuPath))

    // 更新计数
    if (count === 0) {
      // 第一次使用时设置过期时间
      await redis.set(cdKey, 1, { EX: 60 })
    } else {
      // 后续仅增加计数，不重置过期时间
      await redis.incr(cdKey)
    }
  }

  async addDio (e) {
    if (!e.source) {
      e.reply('请回复(引用)一张图片，并发送「添加吊图」')
      return
    }
    let x = await e.group.getChatHistory(e.source.seq, 1)
    let msgArr = x[0].message
    Bot.logger.info(msgArr)
    // [{"type":"image","url":"https://gchat.qpic.cn/gchatpic_new/0/0-0-90018F5409162A253D6ACF704FD7F1EE/0","file":"90018f5409162a253d6acf704fd7f1ee.image"}]
    let targetObj = msgArr.find(item => item.type === 'image')
    if (!targetObj) {
      e.reply('请回复一张图片')
      return
    }
    // 原版云崽
    if (e.bot?.version?.name != 'chronocat') {
      let targetUrl = targetObj.url
      let targetName = targetObj.file
      // 下载图片,保存到dioDir
      let response = await fetch(targetUrl)
      let picPath = path.join(dioDir, targetName)
      // 检查目标是否已经存在
      if (fs.existsSync(picPath)) {
        e.reply('没想到吧，已经有人添加过这张吊图了awa')
        return
      }
      let writeStream = fs.createWriteStream(picPath)
      response.body.pipe(writeStream)
      e.reply('添加成功')
    }
  }

  async delDio (e) {
    if (!e.isMaster) {
      e.reply('只有主人才能删除')
      return
    }
    if (!e.source) {
      // 检查是否跟着具体的文件名，例如4d3a17f1fa52380f426d0af8b12bb9a7580216-800-600.png
      let message = e.raw_message
      // 删除前四个字
      let startName = message.slice(4, 36).trim()
      if (!startName) {
        e.reply('请回复一张图片或者跟上文件名')
        return
      }
      let fileName
      // 遍历dioDir文件夹，找到文件名开头相同的文件
      fs.readdirSync(dioDir).forEach(file => {
        if (file.startsWith(startName)) {
          fileName = file
        }
      })
      if (!fileName) {
        e.reply('文件名不存在')
        return
      }
      let oriFilePath = path.join(dioDir, fileName)
      // 再创建当前日期的文件夹
      let date = new Date()
      let year = date.getFullYear()
      let month = date.getMonth() + 1
      let day = date.getDate()
      let newDir = path.join(oldDir, `${year}-${month}-${day}`)
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir)
      }
      // 不用删除文件，把文件移动到data/ys-old文件夹
      fs.renameSync(oriFilePath, path.join(newDir, fileName))
      e.reply(['删除成功', segment.image(path.join(newDir, fileName))])
      return
    }
    let x = await e.group.getChatHistory(e.source.seq, 1)
    let msgArr = x[0].message
    // [{"type":"image","url":"https://gchat.qpic.cn/gchatpic_new/0/0-0-90018F5409162A253D6ACF704FD7F1EE/0","file":"90018f5409162a253d6acf704fd7f1ee.image"}]
    let targetObj = msgArr.find(item => item.type === 'image')
    if (!targetObj) {
      e.reply('请回复一张图片')
      return
    }
    let targetName = targetObj.file
    Bot.logger.info('targetName:', targetName)
    // 判断dioDir文件夹里是否有以targetName开头的文件
    let files = fs.readdirSync(dioDir)
    // 判断一下前32位是否相同
    targetName = files.find(item => item.startsWith(targetName.slice(0, 32)))
    if (!targetName) {
      e.reply('删除失败')
      return
    }
    let targetPath = path.join(dioDir, targetName)
    if (fs.existsSync(targetPath)) {
      // 再创建当前日期的文件夹
      let date = new Date()
      let year = date.getFullYear()
      let month = date.getMonth() + 1
      let day = date.getDate()
      let newDir = path.join(oldDir, `${year}-${month}-${day}`)
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir)
      }
      // 不用删除文件，把文件移动到data/ys-old文件夹
      fs.renameSync(targetPath, path.join(newDir, targetName))
      e.reply('删除成功')
    } else {
      e.reply(`删除失败${targetName}`)
    }
  }

  async sendDioTen (e) {
    // 获取用户QQ号
    const userId = e.user_id
    const cdKey = `ys:sendDioTen:cd:${userId}`

    // 检查CD
    let cd = await redis.get(cdKey)
    if (cd) {
      // 获取剩余CD时间
      let ttl = await redis.ttl(cdKey)
      let seconds = Math.ceil(ttl)
      e.reply(`吊图十连CD中，请等待${seconds}秒后再试`)
      return
    }

    // 检查文件夹是否存在图片
    let dioPicList = fs.readdirSync(dioDir)
    if (dioPicList.length === 0) {
      e.reply('沙雕图文件夹为空，请执行以下命令获取图片:\ngit clone --depth=1 https://gitee.com/bling_yshs/ys-dio-pic-repo.git ./data/ys-dio-pic')
      return
    }

    // 准备十张随机图片
    let msgList = []
    let usedIndexes = new Set()

    for (let i = 0; i < 10; i++) {
      let randomIndex
      do {
        randomIndex = Math.floor(Math.random() * dioPicList.length)
      } while (usedIndexes.has(randomIndex))

      usedIndexes.add(randomIndex)
      let fileName = dioPicList[randomIndex]
      let dioTuPath = path.join(dioDir, fileName)

      msgList.push({
        user_id: Bot.uin,
        message: [
          fileName,
          segment.image(dioTuPath)
        ]
      })
    }

    // 发送转发消息
    await e.reply(await Bot[Bot.uin].makeForwardMsg(msgList))

    // 设置CD，2分钟
    await redis.set(cdKey, '1', { EX: 300 })
  }

  async whatDio (e) {
    // 获取消息内容
    let message = e.raw_message
    // 删除开头的"这是什么吊图"等字符
    let fileName = message.replace(/^#?这是什么(弔图|吊图|沙雕图)/, '').trim()

    if (!fileName) {
        e.reply('请输入文件名，例如：这是什么吊图52376a4d721bde5494ef1ec6b360f4fb112514-854-766.jpg')
        return
    }

    // 在dioDir中查找匹配的文件
    let files = fs.readdirSync(dioDir)
    let targetFile = files.find(file => {
        // 检查文件名是否以用户输入的前32位字符开头
        return file.startsWith(fileName.slice(0, 32))
    })

    if (!targetFile) {
        e.reply('没有找到这张图片呢~')
        return
    }

    // 发送找到的图片
    let imagePath = path.join(dioDir, targetFile)
    e.reply([
        `找到啦！文件名是：${targetFile}`,
        segment.image(imagePath)
    ])
  }
}
