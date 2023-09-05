import { JsonSchema, JsonSchemaType, JsonSchemaVersion } from 'aws-cdk-lib/aws-apigateway'
import { ProfileType } from '../../consts'
import {ProfileCreateRequest} from '../profiles-mgmt.types'

const requiredProperties: Array<keyof ProfileCreateRequest> = ['profileType', 'displayName']

export const profileCreateReqSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    title: 'ProfileCreateReqModelSchema',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    properties: {
        profileType: {type: JsonSchemaType.STRING, enum: Object.values(ProfileType)},
        displayName: {type: JsonSchemaType.STRING},
        instagramProfile: {type: JsonSchemaType.STRING}
    } satisfies Record<keyof ProfileCreateRequest, JsonSchema>,
    required: requiredProperties
}