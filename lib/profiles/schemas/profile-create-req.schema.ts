import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from 'aws-cdk-lib/aws-apigateway'
import {ProfileType} from '../../consts'
import {ImageRef} from '../../entity.types'
import {ProfileCreateRequest} from '../profiles-mgmt.types'

const requiredProperties: Array<keyof ProfileCreateRequest> = ['profileType', 'displayName']
const requiredProfileImageProperties: Array<keyof ImageRef> = ['key', 'origKey', 'thumbKey']

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
                key: {type: JsonSchemaType.STRING},
                origKey: {type: JsonSchemaType.STRING},
                thumbKey: {type: JsonSchemaType.STRING},
            } satisfies Record<keyof ImageRef, JsonSchema>,
            required: requiredProfileImageProperties
        },
    } satisfies Record<keyof ProfileCreateRequest, JsonSchema>,
    required: requiredProperties,
}