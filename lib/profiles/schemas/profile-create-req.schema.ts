import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from 'aws-cdk-lib/aws-apigateway'
import {imageRefSchema} from '../../common/schemas/image-req.schema'
import {ProfileType} from '../../consts'
import {ImageVariants} from '../../entity.types'
import {ProfileCreateRequest} from '../profiles-mgmt.types'

const requiredProperties: Array<keyof ProfileCreateRequest> = ['profileType', 'displayName']
const requiredProfileImageProperties: Array<keyof ImageVariants> = ['prvw', 'orig', 'thmb']

export const profileCreateReqSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    title: 'ProfileCreateReqModelSchema',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    properties: {
        profileType: {type: JsonSchemaType.STRING, enum: Object.values(ProfileType)},
        displayName: {type: JsonSchemaType.STRING},
        instagramProfile: {type: JsonSchemaType.STRING},
        profileImage: {
            type: JsonSchemaType.OBJECT,
            additionalProperties: false,
            properties: {
                prvw: imageRefSchema,
                orig: imageRefSchema,
                thmb: imageRefSchema,
            } satisfies Record<keyof ImageVariants, JsonSchema>,
            required: requiredProfileImageProperties,
        },
    } satisfies Record<keyof ProfileCreateRequest, JsonSchema>,
    required: requiredProperties,
}