import {randomUUID} from 'crypto'
import {
    assetsBucketImagesS3Key,
    assetsBucketTempS3Key,
    cloudfrontAssetsPrefix,
    ImageType,
    MainPkValue,
    MainTable,
    ProfileType,
} from '../../lib/consts'
import {ProfileEntity} from '../../lib/entity.types'
import {ProcessImageMessage} from '../../lib/types'
import {
    deleteAllItemsFromTable,
    deleteAllObjectsFromBucket,
    getItemFromTableWhenAttributeChange,
    getObjectFromBucket,
    putItemIntoTable,
    putObjectIntoBucket,
    sendMessageToQueue,
} from '../aws-helpers'
import {testAssetsBucketName, testMainTableName, testProcessImageQueueUrl} from '../config'

describe('Process image tests', () => {

    beforeEach(async () => {
        await deleteAllItemsFromTable(testMainTableName, [MainTable.PK, MainTable.SK])
        await deleteAllObjectsFromBucket(testAssetsBucketName, cloudfrontAssetsPrefix)
    })

    test('Should update a profile entity with new image keys', async () => {
        // given
        const profileId = randomUUID()
        const prvwId = randomUUID()
        const origId = randomUUID()
        const thmbId = randomUUID()
        const prvwExt = 'jpeg'
        const origExt = 'png'
        const thmbExt = 'webp'
        const prvwBody = 'prvw'
        const origBody = 'orig'
        const thmbBody = 'thmb'

        const s3Prefix = `${cloudfrontAssetsPrefix}/${assetsBucketTempS3Key}/${profileId}`
        const prvwS3Key = `${s3Prefix}/${prvwId}.${prvwExt}`
        const origS3Key = `${s3Prefix}/${origId}.${origExt}`
        const thmbS3Key = `${s3Prefix}/${thmbId}.${thmbExt}`

        await Promise.all([
            {key: prvwS3Key, body: prvwBody},
            {key: origS3Key, body: origBody},
            {key: thmbS3Key, body: thmbBody},
        ].map(v => putObjectIntoBucket(testAssetsBucketName, v.key, v.body)))

        const beforeUpdateEntity = {
            pk: MainPkValue.PROFILE,
            sk: profileId,
            profileType: ProfileType.MODEL,
            displayName: 'New Brand',
            email: 'a@a.aa',
            instagramProfile: 'some-profile_Name',
            profileImage: {
                prvw: {id: prvwId, key: `/${prvwS3Key}`, ext: prvwExt, width: 100, height: 200},
                orig: {id: origId, key: `/${origS3Key}`, ext: origExt, width: 100, height: 200},
                thmb: {id: thmbId, key: `/${thmbS3Key}`, ext: thmbExt, width: 100, height: 200},
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        } satisfies ProfileEntity

        await putItemIntoTable(testMainTableName, beforeUpdateEntity)

        const msg = {
            profileId,
            type: ImageType.PROFILE,
            imgVars: {
                prvw: beforeUpdateEntity.profileImage.prvw,
                orig: beforeUpdateEntity.profileImage.orig,
                thmb: beforeUpdateEntity.profileImage.thmb,
            },
        } satisfies ProcessImageMessage

        // when
        await sendMessageToQueue(testProcessImageQueueUrl, msg)

        // then
        const entity = await getItemFromTableWhenAttributeChange<ProfileEntity>(
            testMainTableName,
            {pk: MainPkValue.PROFILE, sk: profileId},
            (v) => v.updatedAt !== beforeUpdateEntity.updatedAt)
        expect(entity).toBeDefined()
        expect(entity?.profileImage).toBeDefined()

        const {prvw, orig, thmb} = entity!.profileImage!
        expect(prvw.key).toBe(`/${cloudfrontAssetsPrefix}/${assetsBucketImagesS3Key}/${profileId}/${prvwId}.${prvwExt}`)
        expect(orig.key).toBe(`/${cloudfrontAssetsPrefix}/${assetsBucketImagesS3Key}/${profileId}/${origId}.${origExt}`)
        expect(thmb.key).toBe(`/${cloudfrontAssetsPrefix}/${assetsBucketImagesS3Key}/${profileId}/${thmbId}.${thmbExt}`)

        const [prvwImg, origImg, thmbImg] =
            await Promise.all([prvw.key, orig.key, thmb.key]
                .map(key => removeFirstSlash(key))
                .map(s3Key => getObjectFromBucket(testAssetsBucketName, s3Key)))
        expect(await prvwImg?.transformToString()).toBe(prvwBody)
        expect(await origImg?.transformToString()).toBe(origBody)
        expect(await thmbImg?.transformToString()).toBe(thmbBody)
    }, 10000)
})

const removeFirstSlash = (imgKey: string) => imgKey.replace(/^\//, '')
