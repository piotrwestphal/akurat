// cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --auth-parameters USERNAME="piotr.westphal@gmail.com",PASSWORD="Password123?" --client-id 5077288tbvf5p88o1h23f41adr
// https://github.com/marvinlanhenke/aws-serverless-auth/tree/master/lambda/auth
export const handler = async (event: any = {}) : Promise <any> => {
    console.log(event);

    return { statusCode: 201, body: 'Hello world!' };
};