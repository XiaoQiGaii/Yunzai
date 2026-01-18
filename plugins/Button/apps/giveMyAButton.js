import lodash from 'lodash';
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import {
    createPlayerData,
    filePath,
    getButtonData,
    getPlayerData,
    storagePlayerData
} from '../function/function.js';

export class B extends plugin {
    constructor() {
        super({
            name: '[B]给我一个按钮',
            dsc: '给我一个按钮',
            event: 'message',
            priority: 1,
            rule: [
                { reg: /^[#\/]?(来个|给我一个)按钮$/, fnc: 'giveMyAButton' }
            ]
        });
    }

    async giveMyAButton(e) {
        const playerID = e.user_id;
        createPlayerData(playerID);

        const playerData = await getPlayerData(playerID);
        const { buttonStart, buttonData: playerButtonData, pressButton } = playerData;
        const { get: playerGet, sideEffect: playerSideEffect } = playerButtonData;
        if (buttonStart) {
            const image = await puppeteer.screenshot('按钮评论', {
                tplFile: filePath['giveMyAButton'],
                get: playerGet, sideEffect: playerSideEffect
            });

            return e.reply([
                playerGet,
                '\r———但是———\r',
                playerSideEffect,
                image
            ], true);
        }

        let buttonData = await getButtonData();
        buttonData = buttonData.filter(item => !pressButton.includes(item.index));

        if (!buttonData.length) {
            return e.reply(['没有按钮可按了，请联系主人使用指令来更新按钮库']);
        }

        const randomButton = lodash.sample(buttonData);
        const { index, get, sideEffect } = randomButton;

        playerData['buttonStart'] = true;
        playerData['buttonData'] = { index, get, sideEffect };
        storagePlayerData(playerID, playerData);

        const image = await puppeteer.screenshot('来个按钮', {
            tplFile: filePath['giveMyAButton'],
            get, sideEffect
        });

        return e.reply([
            get,
            '\r———但是———\r',
            sideEffect,
            image
        ], true);
    }
}