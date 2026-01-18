import fetch from "node-fetch";

const URL = ['http://ovoa.cc/api/', '.php?message=', '&type=json']

const C_REGEX = /^(#|\/)?陈泽说(.*)$/
const D_REGEX = /^(#|\/)?丁真说(.*)$/
const S_REGEX = /^(#|\/)?孙笑川说(.*)$/
export class example extends plugin {
    constructor() {
        super({
            name: '[陈泽][丁真][孙笑川]语音合成',
            dsc: 'example',
            event: 'message',
            priority: 1,
            rule: [{
                reg: C_REGEX,
                fnc: 'ChenZe'
            }, {
                reg: D_REGEX,
                fnc: 'DingZhen'
            }, {
                reg: S_REGEX,
                fnc: 'SunXiaoChuan'
            }]
        })
    }

    async ChenZe(e) {
        const CONTENT = GET_CONTENT(C_REGEX, e.msg)
        if (!CONTENT) return e.reply('输入内容为空')
        const URL_DATA = await (await fetch(`${URL[0]}chenze${URL[1]}${CONTENT}${URL[2]}`)).json()

        return SEND(e, URL_DATA['Time-consuming'], URL_DATA['audio-url'])
    }

    async DingZhen(e) {
        const CONTENT = GET_CONTENT(D_REGEX, e.msg)
        if (!CONTENT) return e.reply('输入内容为空')
        const URL_DATA = await (await fetch(`${URL[0]}dingzhen${URL[1]}${CONTENT}${URL[2]}`)).json()

        return SEND(e, URL_DATA['Time-consuming'], URL_DATA['audio-url'])
    }

    async SunXiaoChuan(e) {
        const CONTENT = GET_CONTENT(S_REGEX, e.msg)
        if (!CONTENT) return e.reply('输入内容为空')
        const URL_DATA = await (await fetch(`${URL[0]}sunxiaochuan${URL[1]}${CONTENT}${URL[2]}`)).json()

        return SEND(e, URL_DATA['Time-consuming'], URL_DATA['audio-url'])
    }
}

function GET_CONTENT(regex, msg) {
    const CONTENT = msg.match(regex)[2]
    return CONTENT
}

async function SEND(e, msg, audio) {
    e.reply(`生成成功！耗时：${msg.toFixed(2)}秒`)
    return e.reply(await uploadRecord(audio, 0, false));
}