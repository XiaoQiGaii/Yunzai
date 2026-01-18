import {
    createPlayerData,
    getButtonData,
    getPlayerData,
    storagePlayerData,
    storageButtonData
} from '../function/function.js';

export class B extends plugin {
    constructor() {
        super({
            name: '[B]按还是不按',
            dsc: '按还是不按',
            event: 'message',
            priority: 1,
            rule: [
                { reg: /^[#\/](不)?按下$/, fnc: 'pressOrNotPress' }
            ]
        })
    }

    async pressOrNotPress(e) {
        const playerID = e.user_id
        createPlayerData(playerID)

        const playerData = await getPlayerData(playerID)
        const { buttonStart, buttonData: playerButtonData } = playerData
        const { index } = playerButtonData
        if (!buttonStart) {
            return e.reply(['你还没有按钮呢\r发送[来个按钮]获取吧~'])
        }

        const YoN = e.msg.replace(/#|\//g, '')
        const buttonData = await getButtonData()
        const playerButton = buttonData.filter(item => item.index === index)
        const { press, noPress } = playerButton[0]
        const numberOfPeople = {
            Y: press.length,
            N: noPress.length
        }
        const totalNumberOfPeople = numberOfPeople['N'] + numberOfPeople['Y']

        let buttonPercentage = {
            Y: (((numberOfPeople['Y'] / totalNumberOfPeople) * 100).toFixed(1)),
            N: ((numberOfPeople['N'] / totalNumberOfPeople) * 100).toFixed(1)
        }

        if (isNaN(buttonPercentage['Y'])) buttonPercentage['Y'] = '0.0'
        if (isNaN(buttonPercentage['N'])) buttonPercentage['N'] = '0.0'

        let msg = []
        if (YoN === '按下') {
            msg = [
                '你按下了这个按钮',
                '在你之前',
                `${numberOfPeople['Y']}人(${buttonPercentage['Y']}%)按下这个按钮`,
                `${numberOfPeople['N']}人(${buttonPercentage['N']}%)没按下这个按钮`,
                `可发送[#查看评论${index}]`,
                '来查看该按钮的评论'
            ]

        } else {
            msg = [
                '你没按下这个按钮',
                '在你之前',
                `${numberOfPeople['N']}人(${buttonPercentage['N']}%)没按下这个按钮`,
                `${numberOfPeople['Y']}人(${buttonPercentage['Y']}%)按下这个按钮`,
                `可发送[#查看评论${index}]`,
                '来查看该按钮的评论'
            ]
        }
        playerData['buttonStart'] = false
        playerData['pressButton'].push(index)
        storagePlayerData(playerID, playerData)

        buttonData.forEach(obj => {
            if (obj['index'] === index) {
                if (YoN === '按下') {
                    obj['press'].push(playerID)
                } else {
                    obj['noPress'].push(playerID)
                }
            }
        });
        storageButtonData(buttonData)

        return e.reply(msg.join('\r'), true)
    }
}