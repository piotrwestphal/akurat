import {readFileSync} from 'fs'
import {join} from 'path'
import * as sharp from 'sharp'
import * as request from 'supertest'
import {Response} from 'supertest'
import {assetsBucketTempS3Key, cloudfrontAssetsPrefix} from '../../lib/consts'
import {UploadImageResponse} from '../../lib/profiles/profiles-mgmt.types'
import {deleteAllObjectsFromBucket, getObjectFromBucket} from '../aws-helpers'
import {
    assetsDirPath,
    authorizationHeaderKey,
    defaultUserToken,
    testAssetsBucketName,
    testRestApiEndpoint,
} from '../config'

describe('Create an image api tests', () => {

    const req = request(testRestApiEndpoint)

    beforeEach(async () => {
        await deleteAllObjectsFromBucket(testAssetsBucketName, cloudfrontAssetsPrefix)
    })

    test('POST "/images" should keep the original image format and create a thumbnail image', async () => {
        const testImage = readFileSync(join(assetsDirPath, 'model_01.webp')).toString('base64')

        const res = await req.post('api/v1/images')
            .set(authorizationHeaderKey, defaultUserToken)
            .send({image: testImage})
            .expect('Content-Type', /json/)
            .expect(201)

        const {prvw, orig, thmb} = res.body as UploadImageResponse
        expect(prvw).toBeDefined()
        expect(orig).toBeDefined()
        expect(thmb).toBeDefined()

        expect(prvw.id).toBeDefined()
        expect(prvw.key.startsWith(`/${cloudfrontAssetsPrefix}/${assetsBucketTempS3Key}/`)).toBeTruthy()
        expect(prvw.key.endsWith('.webp')).toBeTruthy()
        expect(prvw.ext).toBe('webp')
        expect(prvw.width).toBe(750)
        expect(prvw.height).toBe(750)

        expect(orig.id).toBeDefined()
        expect(orig.key.startsWith(`/${cloudfrontAssetsPrefix}/${assetsBucketTempS3Key}/`)).toBeTruthy()
        expect(orig.key.endsWith('.webp')).toBeTruthy()
        expect(orig.ext).toBe('webp')
        expect(orig.width).toBe(750)
        expect(orig.height).toBe(750)

        expect(thmb.id).toBeDefined()
        expect(thmb.key.startsWith(`/${cloudfrontAssetsPrefix}/${assetsBucketTempS3Key}/`)).toBeTruthy()
        expect(thmb.key.endsWith('.webp')).toBeTruthy()
        expect(thmb.ext).toBe('webp')
        expect(thmb.width).toBe(200)
        expect(thmb.height).toBe(200)

        expect(prvw).toStrictEqual(orig)

        const pendingGetObjects = [prvw.key, orig.key, thmb.key]
            .map(key => removeFirstSlash(key))
            .map(key => getObjectFromBucket(testAssetsBucketName, key))
        const [prvwOut, origOut, thumbOut] = await Promise.all(pendingGetObjects)

        expect(prvwOut).toBeDefined()
        expect(origOut).toBeDefined()
        expect(thumbOut).toBeDefined()

        const [prvwBuffer, origBuffer, thumbBuffer] = await Promise.all([prvwOut!, origOut!, thumbOut!].map(out => out.transformToByteArray()))
        const [prvwMeta, origMeta, thumbMeta] = await Promise.all([prvwBuffer, origBuffer, thumbBuffer].map(buff => sharp(buff).metadata()))

        expect(prvwMeta.format).toBe(sharp.format.webp.id)
        expect(prvwMeta.width).toBe(750)
        expect(prvwMeta.height).toBe(750)

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

        const {prvw, orig, thmb} = res.body as UploadImageResponse
        expect(prvw.key).toBeDefined()
        expect(orig.key).toBeDefined()
        expect(thmb.key).toBeDefined()

        expect(prvw.key.endsWith('.webp')).toBeTruthy()
        expect(orig.key.endsWith('.jpeg')).toBeTruthy()
        expect(thmb.key.endsWith('.webp')).toBeTruthy()
        expect(prvw.key).not.toBe(orig.key)

        const pendingGetObjects = [prvw.key, orig.key, thmb.key]
            .map(key => removeFirstSlash(key))
            .map(key => getObjectFromBucket(testAssetsBucketName, key))
        const [prvwOut, origOut, thumbOut] = await Promise.all(pendingGetObjects)

        expect(prvwOut).toBeDefined()
        expect(origOut).toBeDefined()
        expect(thumbOut).toBeDefined()

        const [prvwBuffer, origBuffer, thumbBuffer] = await Promise.all([prvwOut!, origOut!, thumbOut!].map(out => out.transformToByteArray()))
        const [prvwMeta, origMeta, thumbMeta] = await Promise.all([prvwBuffer, origBuffer, thumbBuffer].map(buff => sharp(buff).metadata()))

        expect(prvwMeta.format).toBe(sharp.format.webp.id)
        expect(prvwMeta.width).toBe(612)
        expect(prvwMeta.height).toBe(408)

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

        const {prvw, orig, thmb} = res.body as UploadImageResponse
        expect(prvw.key).toBeDefined()
        expect(orig.key).toBeDefined()
        expect(thmb.key).toBeDefined()
        expect(prvw.key.endsWith('.webp')).toBeTruthy()
        expect(orig.key.endsWith('.jpeg')).toBeTruthy()
        expect(thmb.key.endsWith('.webp')).toBeTruthy()
        expect(prvw.key).not.toBe(orig.key)

        const pendingGetObjects = [prvw.key, orig.key, thmb.key]
            .map(key => removeFirstSlash(key))
            .map(key => getObjectFromBucket(testAssetsBucketName, key))
        const [prvwOut, origOut, thmbOut] = await Promise.all(pendingGetObjects)

        expect(prvwOut).toBeDefined()
        expect(origOut).toBeDefined()
        expect(thmbOut).toBeDefined()

        const [prvwBuffer, origBuffer, thmbBuffer] = await Promise.all([prvwOut!, origOut!, thmbOut!]
            .map(out => out.transformToByteArray()))
        const [prvwMeta, origMeta, thmbMeta] = await Promise.all([prvwBuffer, origBuffer, thmbBuffer]
            .map(buff => sharp(buff).metadata()))

        expect(prvwMeta.format).toBe(sharp.format.webp.id)
        expect(prvwMeta.width).toBe(530)
        expect(prvwMeta.height).toBe(796)

        expect(origMeta.format).toBe(sharp.format.jpeg.id)
        expect(origMeta.width).toBe(530)
        expect(origMeta.height).toBe(796)

        expect(thmbMeta.format).toBe(sharp.format.webp.id)
        expect(thmbMeta.width).toBe(133)
        expect(thmbMeta.height).toBe(200)
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

const removeFirstSlash = (s3Key: string) => s3Key.replace(/^\//, '')
