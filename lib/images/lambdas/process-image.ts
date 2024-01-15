import {DynamoDBClient, GetItemCommand, PutItemCommand} from '@aws-sdk/client-dynamodb'
import {CopyObjectCommand, S3Client} from '@aws-sdk/client-s3'
import {SNSClient} from '@aws-sdk/client-sns'
import {marshall, unmarshall} from '@aws-sdk/util-dynamodb'
import {ServiceException} from '@smithy/smithy-client'
import {sendAlarm} from '../../common/alarm-sender'
import {assetsBucketImagesS3Key, cloudfrontAssetsPrefix, MainPkValue, MainTable} from '../../consts'
import {ProfileEntity} from '../../entity.types'
import {ProcessImageMessage} from '../../types'

const tableName = process.env.TABLE_NAME as string
const bucketName = process.env.BUCKET_NAME as string
const topicArn = process.env.TOPIC_ARN as string
const s3Client = new S3Client()
const dynamoClient = new DynamoDBClient()
const snsClient = new SNSClient()

type SqsMessage = Readonly<{
    messageId: string
    body: string
}>

type SqsEvent = Readonly<{
    Records: SqsMessage[]
}>

export const handler = async (ev: SqsEvent): Promise<void> => {
    const records = ev.Records.map(rec => ({id: rec.messageId, msg: JSON.parse(rec.body) as ProcessImageMessage}))

    for (const {id, msg} of records) {
        console.debug(`Received an image process message for the msg id [${id}]`, msg)
        try {
            const result = await dynamoClient.send(new GetItemCommand({
                TableName: tableName,
                Key: marshall({
                    pk: MainPkValue.PROFILE,
                    sk: msg.profileId,
                } satisfies Pick<ProfileEntity, MainTable.PK | MainTable.SK>),
            }))

            if (!result.Item) {
                console.error(`Not found a profile entity with id [${msg.profileId}]`)
                continue
            }
            const itemEntity = unmarshall(result.Item) as ProfileEntity

            if (!itemEntity.profileImage) {
                console.error(`Not found profile image variants for entity with id [${msg.profileId}]`)
                continue
            }

            const {profileImage: {prvw, orig, thmb}} = itemEntity

            const s3TempPrefixForUser = `${cloudfrontAssetsPrefix}/${assetsBucketImagesS3Key}/${msg.profileId}`

            const newPrwvS3Key = `${s3TempPrefixForUser}/${prvw.id}.${prvw.ext}`
            const newOrigS3Key = `${s3TempPrefixForUser}/${orig.id}.${orig.ext}`
            const newThmbS3Key = `${s3TempPrefixForUser}/${thmb.id}.${thmb.ext}`

            await Promise.all([
                {newS3Key: newPrwvS3Key, oldKey: prvw.key},
                {newS3Key: newOrigS3Key, oldKey: orig.key},
                {newS3Key: newThmbS3Key, oldKey: thmb.key},
            ].map(({newS3Key, oldKey}) =>
                s3Client.send(new CopyObjectCommand({
                    Bucket: bucketName,
                    Key: newS3Key,
                    CopySource: `${bucketName}${oldKey}`,
                }))))

            const updated = {
                ...itemEntity,
                updatedAt: Date.now(),
                profileImage: {
                    prvw: {
                        ...prvw,
                        key: `/${newPrwvS3Key}`,
                    },
                    orig: {
                        ...orig,
                        key: `/${newOrigS3Key}`,
                    },
                    thmb: {
                        ...thmb,
                        key: `/${newThmbS3Key}`,
                    },
                },
            } satisfies ProfileEntity

            console.debug('Saving an updated profile entity', updated)
            await dynamoClient.send(new PutItemCommand({
                TableName: tableName,
                Item: marshall(updated),
            }))
            console.log('Saved an updated profile entity')
        } catch (err) {
            const errMsg = `Error during processing an image for the msg id [${id}]`
            console.error(errMsg, err)
            const {name, message} = err as ServiceException
            await sendAlarm(snsClient, topicArn, {
                source: 'Processing image lambda',
                payload: {message: errMsg, details: `${name} ${message}`},
            })
        }
    }
}
