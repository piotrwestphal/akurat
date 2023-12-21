import {JsonSchema, JsonSchemaType} from 'aws-cdk-lib/aws-apigateway'
import {ImgRef} from '../../entity.types'

export const imageRefSchema: JsonSchema = {
    type: JsonSchemaType.OBJECT,
    properties: {
        id: {type: JsonSchemaType.STRING},
        key: {type: JsonSchemaType.STRING},
        ext: {type: JsonSchemaType.STRING},
        width: {type: JsonSchemaType.INTEGER},
        height: {type: JsonSchemaType.INTEGER},
    } satisfies Record<keyof ImgRef, JsonSchema>,
    additionalProperties: false,
    required: ['id', 'key', 'ext', 'width', 'height'] satisfies Array<keyof ImgRef>
}