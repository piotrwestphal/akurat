// cognito-idp initiate-auth --auth-flow REFRESH_TOKEN_AUTH --auth-parameters REFRESH_TOKEN="token" --client-id 5077288tbvf5p88o1h23f41adr
export const handler = async (event: any = {}) : Promise <any> => {
    console.log(event);

    return { statusCode: 201, body: 'Hello world!' };
};