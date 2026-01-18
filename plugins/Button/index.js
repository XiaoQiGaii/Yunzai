import fs from 'node:fs'
import { filePath } from './function/function.js'
logger.info('按钮载入中...')

fs.mkdirSync('data/Ts-GameData/Button', { recursive: true })
const files = fs.readdirSync('./plugins/Button/apps').filter(file => file.endsWith('.js'))

if (!fs.existsSync(filePath['button'])) {
    fs.writeFileSync(filePath['button'], JSON.stringify(await JSON.parse(fs.readFileSync(filePath['defaultButton'], 'utf8')), null, 4));
}

let ret = []

files.forEach((file) => {
    ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
    let name = files[i].replace('.js', '')

    if (ret[i].status != 'fulfilled') {
        logger.error(`载入插件错误：${logger.red(name)}`)
        logger.error(ret[i].reason)
        continue
    }
    apps[name] = ret[i].value[Object.keys(ret[i].value)[0]]
}
export { apps }
logger.mark('按钮载入成功')