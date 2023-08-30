import { JsonSchema, JsonSchemaType, JsonSchemaVersion } from 'aws-cdk-lib/aws-apigateway'
import { ConfirmSignupReq } from '../auth.types'

const requiredProperties: Array<keyof ConfirmSignupReq> = ['email', 'confirmationCode']

export const confirmSignupReqSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    title: 'ConfirmSignupReqModelSchema',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    properties: {
        email: {type: JsonSchemaType.STRING, format: 'email'},
        confirmationCode: {type: JsonSchemaType.STRING}
    } satisfies Record<keyof ConfirmSignupReq, JsonSchema>,
    required: requiredProperties
}