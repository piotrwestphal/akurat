import {readdir, readFile, unlink} from 'node:fs/promises'
import {join} from 'path'
import * as sharp from 'sharp'
import {ResizeOptions} from 'sharp'

const assetsPath = join(__dirname, '_assets')
const refImgsPath = join(assetsPath, 'ref')
const tempImgsPath = join(assetsPath, 'temp')

xdescribe('Sharp playground', () => {

    beforeEach(async () => {
        for (const file of await readdir(tempImgsPath)) {
            await unlink(join(tempImgsPath, file))
        }
    })

    test('Test 1', async () => {
        const image = await readFile(join(refImgsPath, 'model_01.jpg'))
        console.time('original meta')
        const metadata = await sharp(image).metadata()
        console.timeEnd('original meta')
        console.time('converting original')
        const convertedImg = await sharp(image).webp().toBuffer()
        const testImage = await sharp({
            create: {
                height: 200,
                width: 200,
                channels: 4,
                background: {r: 255, g: 0, b: 0, alpha: 0.5},
            },
        }).jpeg().toBuffer()
        console.log({img: testImage.toString('base64')})
        console.timeEnd('converting original')
        console.time('unconverted meta')
        const convertedImgMeta = await sharp(image).webp().metadata()
        console.timeEnd('unconverted meta')
        console.time('converted meta')
        const conMeta = await sharp(convertedImg).metadata()
        console.timeEnd('converted meta')
        console.time('save')
        const a = await sharp(image)
            .resize({
                width: 150,
                fit: 'cover',
            }).toFile(join(tempImgsPath, `${Date.now()}.${metadata.format}`))
        console.timeEnd('save')
    })

    test('Test 2', async () => {
        const image = await readFile(join(refImgsPath, 'model_01.jpg'))
        const metadata = await sharp(image).metadata()
        const sizeMetaParams: ResizeOptions = metadata.height! > metadata.width!
            ? {height: 150} : {width: 150}
        const a = await sharp(image)
            .resize({...sizeMetaParams, fit: 'cover'})
            .toFile(join(tempImgsPath, `${Date.now()}.${metadata.format}`))
    })
})


