export type CognitoClaims = Readonly<{
    sub: string                 // 48c516d4-b8c9-4f4b-8dda-b3981ff41040
    iss: string                 // https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_aazzXX
    'cognito:username': string  // 48c516d4-b8c9-4f4b-8dda-b3981ff41040
    origin_jti: string          // d8abff89-b5a0-4469-977f-2b6e4d31e586
    aud: string                 // 33qki9jqdhd0pibjbub1avm465
    event_id: string            // 36a01835-8cc3-4347-a784-1dd581391ede
    token_use: string           // id
    auth_time: number           // 1693827009
    exp: number                 // 1693851415
    iat: number                 // 1693850515
    jti: string                 // 15ed1900-b152-4bca-976c-120e6e3f49fc
    email: string               // lech.klesa@ipn.com
}>

export type ApiGatewayEvent = Readonly<{
    body: string
    requestContext: Readonly<{
        path: string                // "/dev/some-resource"
        requestTimeEpoch: number    // 1663016328068
        authorizer: Readonly<{
            claims: CognitoClaims
        }>
    }>
    headers: Record<string, string>
    pathParameters?: Readonly<{
        id: string
    }>
    queryStringParameters?: Record<string, string>
}>


export type ApiGatewayLambdaResponse = Readonly<{
    statusCode: number
    body?: string
    headers?: Record<string, string>
}>
