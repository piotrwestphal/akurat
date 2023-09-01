import { JsonSchema, JsonSchemaType, JsonSchemaVersion } from 'aws-cdk-lib/aws-apigateway'
import { AuthReq } from '../auth.types'

const requiredProperties: Array<keyof AuthReq> = ['email', 'password']

export const authReqSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    title: 'AuthReqModelSchema',
    type: JsonSchemaType.OBJECT,
    additionalProperties: false,
    properties: {
        email: {type: JsonSchemaType.STRING, format: 'email'},
        password: {type: JsonSchemaType.STRING}
    } satisfies Record<keyof AuthReq, JsonSchema>,
    required: requiredProperties
}