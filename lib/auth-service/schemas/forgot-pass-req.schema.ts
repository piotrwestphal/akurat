import { JsonSchema, JsonSchemaType, JsonSchemaVersion } from 'aws-cdk-lib/aws-apigateway'
import { AuthReq, ForgotPasswordReq } from '../auth.types'

const requiredProperties: Array<keyof AuthReq> = ['email']

export const forgotPassReqSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    title: 'ForgotPassReqModelSchema',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    properties: {
        email: {type: JsonSchemaType.STRING, format: 'email'},
    } satisfies Record<keyof ForgotPasswordReq, JsonSchema>,
    required: requiredProperties
}