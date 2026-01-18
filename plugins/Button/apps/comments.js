import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import {
    createPlayerData,
    getButtonData,
    getPlayerData,
    storageButtonData,
    filePath
} from '../function/function.js';

export class B extends plugin {
    constructor() {
        super({
            name: '[B]评论',
            dsc: '查看或发表评论',
            event: 'message',
            priority: 1,
            rule: [
                { reg: /^[#\/]查看评论\d+$/, fnc: 'viewComments' },
                { reg: /^[#\/]评论按钮(\d+)\*(.*)/, fnc: 'commentsButton' }
            ]
        });
    }

    async viewComments(e) {
        const buttonData = await getButtonData();
        const index = parseInt(e.msg.replace(/#|\/|查看评论/g, ''));

        const commentData = buttonData.find(obj => obj['index'] === index)?.['comment'] || [];

        if (!commentData.length) {
            return e.reply([
                '暂没有评论',
                `可发送[#评论按钮${index}*内容]`,
                '来评论按钮'
            ].join('\r'));
        }

        const image = await puppeteer.screenshot('按钮评论', {
            tplFile: filePath['comments'],
            commentData
        });

        return e.reply([image]);
    }

    async commentsButton(e) {
        const playerID = e.user_id;
        createPlayerData(playerID);

        const playerData = await getPlayerData(playerID);
        const [, index, commentContent] = e.msg.match(/^[#\/]评论按钮(\d+)\*(.*)/);

        if (commentContent.length >= 72) {
            return e.reply(['超出评论字符上限，最高仅支持72个字符']);
        }

        if (!playerData['pressButton'].includes(parseInt(index))) {
            return e.reply(['你还不能评论这个按钮']);
        }

        const avatar = this.getAvatar(e, playerID);
        const date = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const commentData = {
            ID: playerID,
            avatar,
            text: commentContent,
            date,
            ['❤']: [],
            ['💔']: []
        };

        const buttonData = await getButtonData();
        const button = buttonData.find(obj => obj['index'] === parseInt(index));

        if (button) {
            const existingComment = button['comment'].find(c => c['ID'] === playerID);
            if (existingComment) {
                existingComment['text'] = commentContent;
                existingComment['date'] = date;
            } else {
                button['comment'].push(commentData);
            }
        }

        storageButtonData(buttonData);

        return e.reply(['评论成功~']);
    }

    getAvatar(e, playerID) {
        if (e.adapter === 'QQBot') {
            return `https://q.qlogo.cn/qqapp/${e.bot.config.appid}/${e.author.member_openid}/640`;
        } else {
            return `https://q1.qlogo.cn/g?b=qq&nk=${playerID}&s=160`;
        }
    }
}