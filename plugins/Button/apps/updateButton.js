import fetch from 'node-fetch';
import {
    getButtonData,
    storageButtonData
} from '../function/function.js';

export class B extends plugin {
    constructor() {
        super({
            name: '[B]更新按钮',
            dsc: '更新按钮',
            event: 'message',
            priority: 1,
            rule: [
                { reg: /^[#\/]更新按钮库$/, fnc: 'updateButton', permission: 'master' }
            ]
        })
    }

    async updateButton(e) {
        try {
            const cloudButtonData = await (await fetch('https://gitee.com/Tloml-Starry/Button/raw/master/data/DefaultButtonData.json')).json();
            const cloudButtonNumber = cloudButtonData.length;
            logger.mark('云库共有', logger.green(cloudButtonNumber), '个按钮');

            const buttonData = await getButtonData();
            const buttonMap = new Map(buttonData.map(button => [button.get, button]));

            let newButtonCount = 0;

            for (const cloudButton of cloudButtonData) {
                if (!buttonMap.has(cloudButton.get)) {
                    buttonData.push({
                        index: buttonData.length + 1,
                        get: cloudButton.get,
                        sideEffect: cloudButton.sideEffect,
                        comment: [],
                        press: [],
                        noPress: []
                    });
                    newButtonCount++;
                }
            }

            storageButtonData(buttonData);
            return e.reply([`更新完成，本次更新了${newButtonCount}个按钮`])
        } catch (error) {
            logger.error('更新按钮时出现错误：', error);
        }
    }
}