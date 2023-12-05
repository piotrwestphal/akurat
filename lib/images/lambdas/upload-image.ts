import {PutObjectCommand, S3Client, S3ServiceException} from '@aws-sdk/client-s3'
import {ApiGatewayEvent, ApiGatewayLambdaResponse} from '@lambda-types'
import {randomUUID} from 'crypto'
// import in this form is used here intentionally
import sharp, {Metadata, ResizeOptions} from 'sharp'
import {assetsBucketTempS3Key, cloudfrontAssetsPrefix} from '../../consts'
import {UploadImageRequest, UploadImageResponse} from '../../profiles/profiles-mgmt.types'

const bucketName = process.env.BUCKET_NAME as string
const s3Client = new S3Client()

type Event = Readonly<{
    queryStringParameters: {
        idx: string
    }
}> & ApiGatewayEvent

// https://antyweb.pl/webp-jpg-pobieranie
// https://sharp.pixelplumbing.com - library for converting images (including webp format)
// https://www.kurzor.net/blog/uploading-and-resizing-images-part1
// https://www.kurzor.net/blog/uploading-and-resizing-images-part2
// https://www.bytescale.com/blog/aws-lambda-image-resize/
// https://aws.amazon.com/blogs/compute/uploading-to-amazon-s3-directly-from-a-web-or-mobile-application/
// https://medium.com/nona-web/converting-images-to-webp-from-cdn-9433b56a3d52
// https://www.adrenalinmedia.com.au/webp-with-cloudfront-cdn-and-s3/
// use resizing urls i.e. https://ik.imagekit.io/ikmedia/ik_ecom/shoe.jpeg?tr=w-400,h-300,cm-pad_resize,bg-F5F5F5
// 1. Upload profile image
// 2. Before - put transform image to webp
// 4. In response receive resized image - smaller one
// 5. When clicking in gallery - request for bigger image than profile image

const sizeLimitBytes = 1024 * 1024   // 1MB

export const handler = async ({
                                  body,
                                  requestContext: {authorizer: {claims}},
                              }: Event): Promise<ApiGatewayLambdaResponse> => {
    const {image} = JSON.parse(body) as UploadImageRequest
    const origImgBuffer = Buffer.from(image, 'base64')

    let origImgMeta: Metadata
    try {
        origImgMeta = await sharp(origImgBuffer).metadata()
    } catch (err) {
        console.error(`Error during accessing an image metadata for a user with email [${claims.email}]`, err)
        return {
            statusCode: 400,
            body: JSON.stringify({message: `Unsupported image format`}),
        }
    }

    try {
        if (origImgMeta.size! > sizeLimitBytes) {
            return {
                statusCode: 400,
                body: JSON.stringify({message: `Image size '${origImgMeta.size} bytes' exceeds the limit '${sizeLimitBytes} bytes'`}),
            }
        }
        const s3TempPrefixForUser = `${assetsBucketTempS3Key}/${claims.sub}`

        // https://sharp.pixelplumbing.com/api-resize
        const thumbMetaDimParams: ResizeOptions = origImgMeta.height! > origImgMeta.width!
            ? {height: 200} : {width: 200}
        const thumbImgBuffer = await sharp(origImgBuffer)
            .webp()
            .resize({...thumbMetaDimParams, fit: 'cover'})
            .toBuffer()
        const thumbImgMeta = await sharp(thumbImgBuffer).metadata()

        const origImgS3Key = `${s3TempPrefixForUser}/${randomUUID()}.${origImgMeta.format}`
        const thumbImgS3Key = `${s3TempPrefixForUser}/${randomUUID()}.${thumbImgMeta.format}`

        const imgsToSave = [
            {image: origImgBuffer, key: origImgS3Key},
            {image: thumbImgBuffer, key: thumbImgS3Key},
        ]

        let imgS3Key: string

        // if the original format is a '.webp'
        if (origImgMeta.format === sharp.format.webp.id) {
            imgS3Key = origImgS3Key
        } else {
            const imgBuffer = await sharp(origImgBuffer).webp().toBuffer()
            const imgMeta = await sharp(thumbImgBuffer).metadata()
            imgS3Key = `${s3TempPrefixForUser}/${randomUUID()}.${imgMeta.format}`
            imgsToSave.push({image: imgBuffer, key: imgS3Key})
        }

        await Promise.all(imgsToSave.map(v => s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: v.key,
            Body: v.image,
        }))))

        const key = `/${cloudfrontAssetsPrefix}/${imgS3Key}`
        const origKey = `/${cloudfrontAssetsPrefix}/${origImgS3Key}`
        const thumbKey = `/${cloudfrontAssetsPrefix}/${thumbImgS3Key}`
        return {
            statusCode: 201,
            body: JSON.stringify({key, thumbKey, origKey} satisfies UploadImageResponse),
        }
    } catch (err) {
        console.error(`Error during uploading an image for a user with email [${claims.email}]`, err)
        const {name, message} = err as S3ServiceException
        return {
            statusCode: 500,
            body: JSON.stringify({message: `${name}: ${message}`}),
        }
    }
}