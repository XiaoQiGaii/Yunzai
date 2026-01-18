import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import {
    filePath
} from '../function/function.js';

export class B extends plugin {
    constructor() {
        super({
            name: '[B]帮助',
            dsc: '帮助',
            event: 'message',
            priority: 1,
            rule: [
                { reg: /^[#\/]?按钮(帮助|菜单)/, fnc: 'help' }
            ]
        })
    }

    async help(e) {
        const image = await puppeteer.screenshot('面包帮助', { tplFile: filePath['help'] })
        return e.reply([image])
    }
}