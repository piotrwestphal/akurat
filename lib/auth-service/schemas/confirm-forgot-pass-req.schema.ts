import { JsonSchema, JsonSchemaType, JsonSchemaVersion } from 'aws-cdk-lib/aws-apigateway'
import { ConfirmForgotPasswordReq } from '../auth.types'

const requiredProperties: Array<keyof ConfirmForgotPasswordReq> = ['email', 'password', 'confirmationCode']

export const confirmForgotPassReqSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    title: 'ConfirmForgotPassReqModelSchema',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    properties: {
        email: {type: JsonSchemaType.STRING, format: 'email'},
        password: {type: JsonSchemaType.STRING},
        confirmationCode: {type: JsonSchemaType.STRING},
    } satisfies Record<keyof ConfirmForgotPasswordReq, JsonSchema>,
    required: requiredProperties
}