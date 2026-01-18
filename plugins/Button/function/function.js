import fs from 'fs'; import path from 'path'; import Yaml from 'yaml';

const ontologyPath = path.resolve()
const pluginPath = path.join(ontologyPath, 'plugins', 'Button')
export const filePath = {
    player: path.join(ontologyPath, 'data', 'Ts-GameData', 'Button'),
    defaultButton: path.join(pluginPath, 'data', 'DefaultButtonData.json'),
    button: path.join(pluginPath, 'data', 'ButtonData.json'),
    comments: path.join(pluginPath, 'resources', 'html', 'comments', 'index.html'),
    giveMyAButton: path.join(pluginPath, 'resources', 'html', 'giveMyAButton', 'index.html'),
    help: path.join(pluginPath, 'resources', 'html', 'help', 'index.html')
}

/** 创建玩家数据 */
export function createPlayerData(ID) {
    const playerFilePath = path.join(filePath['player'], `${ID}.json`);
    if (!fs.existsSync(playerFilePath)) {
        storagePlayerData(ID, {
            buttonStart: false,
            buttonData: {
                index: 0,
                get: "",
                sideEffect: ""
            },
            pressButton: []
        });
    }
}

/** 存储玩家数据 */
export function storagePlayerData(ID, data) {
    const playerFilePath = path.join(filePath['player'], `${ID}.json`);
    fs.writeFileSync(playerFilePath, JSON.stringify(data, null, 4));
}

/** 存储按钮数据 */
export function storageButtonData(data) {
    fs.writeFileSync(filePath['button'], JSON.stringify(data, null, 4));
}

/** 读取玩家数据 */
export async function getPlayerData(ID) {
    const playerFilePath = path.join(filePath['player'], `${ID}.json`);
    return JSON.parse(fs.readFileSync(playerFilePath, 'utf8'));
}

/** 读取按钮数据 */
export async function getButtonData() {
    return JSON.parse(fs.readFileSync(filePath['button'], 'utf8'));
}