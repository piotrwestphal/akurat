export type ApiGatewayEvent = Readonly<{
    body: string
    requestContext: Readonly<{
        path: string                // "/dev/some-resource"
        requestTimeEpoch: number    // 1663016328068
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
