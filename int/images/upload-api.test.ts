import {readFileSync} from 'fs'
import {join} from 'path'
import * as sharp from 'sharp'
import * as request from 'supertest'
import {Response} from 'supertest'
import {assetsBucketTempS3Key, cloudfrontAssetsPrefix} from '../../lib/consts'
import {UploadImageResponse} from '../../lib/profiles/profiles-mgmt.types'
import {deleteAllObjectsFromBucket, getObjectFromBucket} from '../aws-helpers'
import {
    assetsBucketName,
    assetsDirPath,
    authorizationHeaderKey,
    defaultUserToken,
    testRestApiEndpoint,
} from '../config'

describe('Create an image api tests', () => {

    const req = request(testRestApiEndpoint)

    beforeEach(async () => {
        await deleteAllObjectsFromBucket(assetsBucketName, assetsBucketTempS3Key)
    })

    test('POST "/images" should keep the original image format and create a thumbnail image', async () => {
        const testImage = readFileSync(join(assetsDirPath, 'model_01.webp')).toString('base64')

        const res = await req.post('api/v1/images')
            .set(authorizationHeaderKey, defaultUserToken)
            .send({image: testImage})
            .expect('Content-Type', /json/)
            .expect(201)

        const {imgKey, origKey, thumbKey} = res.body as UploadImageResponse
        expect(imgKey).toBeDefined()
        expect(origKey).toBeDefined()
        expect(thumbKey).toBeDefined()
        expect(imgKey.startsWith(`/${cloudfrontAssetsPrefix}/${assetsBucketTempS3Key}/`)).toBeTruthy()
        expect(imgKey.endsWith('.webp')).toBeTruthy()
        expect(origKey.startsWith(`/${cloudfrontAssetsPrefix}/${assetsBucketTempS3Key}/`)).toBeTruthy()
        expect(origKey.endsWith('.webp')).toBeTruthy()
        expect(thumbKey.startsWith(`/${cloudfrontAssetsPrefix}/${assetsBucketTempS3Key}/`)).toBeTruthy()
        expect(thumbKey.endsWith('.webp')).toBeTruthy()
        expect(imgKey).toBe(origKey)

        const pendingGetObjects = [imgKey, origKey, thumbKey]
            .map(key => removeCdnPrefix(key))
            .map(key => getObjectFromBucket(assetsBucketName, key))
        const [imgOut, origOut, thumbOut] = await Promise.all(pendingGetObjects)

        expect(imgOut).toBeDefined()
        expect(origOut).toBeDefined()
        expect(thumbOut).toBeDefined()

        const [imgBuffer, origBuffer, thumbBuffer] = await Promise.all([imgOut!, origOut!, thumbOut!].map(out => out.transformToByteArray()))
        const [imgMeta, origMeta, thumbMeta] = await Promise.all([imgBuffer, origBuffer, thumbBuffer].map(buff => sharp(buff).metadata()))

        expect(imgMeta.format).toBe(sharp.format.webp.id)
        expect(imgMeta.width).toBe(750)
        expect(imgMeta.height).toBe(750)

        expect(origMeta.format).toBe(sharp.format.webp.id)
        expect(origMeta.width).toBe(750)
        expect(origMeta.height).toBe(750)

        expect(thumbMeta.format).toBe(sharp.format.webp.id)
        expect(thumbMeta.width).toBe(200)
        expect(thumbMeta.height).toBe(200)
    }, 5000)

    test('POST "/images" should convert the original image to "webp" and create a thumbnail image [1]', async () => {
        const testImage = readFileSync(join(assetsDirPath, 'model_02.jpeg')).toString('base64')

        const res = await req.post('api/v1/images')
            .set(authorizationHeaderKey, defaultUserToken)
            .send({image: testImage})
            .expect('Content-Type', /json/)
            .expect(201)

        const {imgKey, origKey, thumbKey} = res.body as UploadImageResponse
        expect(imgKey).toBeDefined()
        expect(origKey).toBeDefined()
        expect(thumbKey).toBeDefined()
        expect(imgKey.endsWith('.webp')).toBeTruthy()
        expect(origKey.endsWith('.jpeg')).toBeTruthy()
        expect(thumbKey.endsWith('.webp')).toBeTruthy()
        expect(imgKey).not.toBe(origKey)

        const pendingGetObjects = [imgKey, origKey, thumbKey]
            .map(key => removeCdnPrefix(key))
            .map(key => getObjectFromBucket(assetsBucketName, key))
        const [imgOut, origOut, thumbOut] = await Promise.all(pendingGetObjects)

        expect(imgOut).toBeDefined()
        expect(origOut).toBeDefined()
        expect(thumbOut).toBeDefined()

        const [imgBuffer, origBuffer, thumbBuffer] = await Promise.all([imgOut!, origOut!, thumbOut!].map(out => out.transformToByteArray()))
        const [imgMeta, origMeta, thumbMeta] = await Promise.all([imgBuffer, origBuffer, thumbBuffer].map(buff => sharp(buff).metadata()))

        expect(imgMeta.format).toBe(sharp.format.webp.id)
        expect(imgMeta.width).toBe(612)
        expect(imgMeta.height).toBe(408)

        expect(origMeta.format).toBe(sharp.format.jpeg.id)
        expect(origMeta.width).toBe(612)
        expect(origMeta.height).toBe(408)

        expect(thumbMeta.format).toBe(sharp.format.webp.id)
        expect(thumbMeta.width).toBe(200)
        expect(thumbMeta.height).toBe(133)
    }, 5000)

    test('POST "/images" should convert the original image to "webp" and create a thumbnail image [2]', async () => {
        const testImage = readFileSync(join(assetsDirPath, 'model_03.jpg')).toString('base64')

        const res = await req.post('api/v1/images')
            .set(authorizationHeaderKey, defaultUserToken)
            .send({image: testImage})
            .expect('Content-Type', /json/)
            .expect(201)

        const {imgKey, origKey, thumbKey} = res.body as UploadImageResponse
        expect(imgKey).toBeDefined()
        expect(origKey).toBeDefined()
        expect(thumbKey).toBeDefined()
        expect(imgKey.endsWith('.webp')).toBeTruthy()
        expect(origKey.endsWith('.jpeg')).toBeTruthy()
        expect(thumbKey.endsWith('.webp')).toBeTruthy()
        expect(imgKey).not.toBe(origKey)

        const pendingGetObjects = [imgKey, origKey, thumbKey]
            .map(key => removeCdnPrefix(key))
            .map(key => getObjectFromBucket(assetsBucketName, key))
        const [imgOut, origOut, thumbOut] = await Promise.all(pendingGetObjects)

        expect(imgOut).toBeDefined()
        expect(origOut).toBeDefined()
        expect(thumbOut).toBeDefined()

        const [imgBuffer, origBuffer, thumbBuffer] = await Promise.all([imgOut!, origOut!, thumbOut!].map(out => out.transformToByteArray()))
        const [imgMeta, origMeta, thumbMeta] = await Promise.all([imgBuffer, origBuffer, thumbBuffer].map(buff => sharp(buff).metadata()))

        expect(imgMeta.format).toBe(sharp.format.webp.id)
        expect(imgMeta.width).toBe(530)
        expect(imgMeta.height).toBe(796)

        expect(origMeta.format).toBe(sharp.format.jpeg.id)
        expect(origMeta.width).toBe(530)
        expect(origMeta.height).toBe(796)

        expect(thumbMeta.format).toBe(sharp.format.webp.id)
        expect(thumbMeta.width).toBe(133)
        expect(thumbMeta.height).toBe(200)
    }, 5000)

    test('POST "/images" should fail due to too large payload [1]', async () => {
        const testImage = await sharp({
            create: {
                height: 1500,
                width: 1500,
                channels: 4,
                background: {r: 255, g: 0, b: 0, alpha: 0.5},
            },
        }).raw().toBuffer()
        await req.post('api/v1/images')
            .set(authorizationHeaderKey, defaultUserToken)
            .send({image: testImage.toString('base64')})
            .expect('Content-Type', /text/)
            .expect(413)
            .then((res: Response) => {
                expect(res.text).toMatch(/HTTP content length exceeded 10485760 bytes./)
                console.log('BODY:', res.body)
            })
    }, 10000)

    test('POST "/images" should fail due to too large payload [2]', async () => {
        const testImage = await sharp({
            create: {
                height: 15000,
                width: 6000,
                channels: 4,
                background: {r: 255, g: 0, b: 0, alpha: 0.5},
            },
        }).png().toBuffer()
        await req.post('api/v1/images')
            .set(authorizationHeaderKey, defaultUserToken)
            .send({image: testImage.toString('base64')})
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/exceeds the limit '1048576 bytes'/)
                console.log('BODY:', res.body)
            })
    }, 10000)

    test('POST "/images" should fail due to unsupported image format', async () => {
        const testImage = await sharp({
            create: {
                height: 200,
                width: 200,
                channels: 4,
                background: {r: 255, g: 0, b: 0, alpha: 0.5},
            },
        }).raw().toBuffer()
        await req.post('api/v1/images')
            .set(authorizationHeaderKey, defaultUserToken)
            .send({image: testImage.toString('base64')})
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res: Response) => {
                expect(res.text).toMatch(/Unsupported image format/)
            })
    }, 5000)
})

const removeCdnPrefix = (s3Key: string) => s3Key.replace(`/${cloudfrontAssetsPrefix}/`, '')
