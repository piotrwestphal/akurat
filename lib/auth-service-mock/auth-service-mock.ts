import {Duration, RemovalPolicy} from 'aws-cdk-lib'
import {CognitoUserPoolsAuthorizer, IAuthorizer} from 'aws-cdk-lib/aws-apigateway'
import {AccountRecovery, UserPool} from 'aws-cdk-lib/aws-cognito'
import {Construct} from 'constructs'
import {UserParams} from '../types'
import {CognitoUser} from './cognito-user'

type AuthProps = Readonly<{
    envName: string
    testUser: UserParams
}>

export class AuthServiceMock extends Construct {

    readonly authorizer: IAuthorizer
    readonly userPoolClientId: string

    constructor(scope: Construct,
                id: string,
                {
                    envName,
                    testUser,
                }: AuthProps) {
        super(scope, id)

        const userPool = new UserPool(this, 'UserPool', {
            userPoolName: `${envName}-UserPool`,
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireDigits: true,
                requireUppercase: false,
                requireSymbols: false,
            },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            removalPolicy: RemovalPolicy.DESTROY,
        })

        this.authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
            cognitoUserPools: [userPool],
        })

        const userPoolClient = userPool.addClient('UserPoolClient', {
            authFlows: {userPassword: true},
            idTokenValidity: Duration.minutes(15),
            accessTokenValidity: Duration.minutes(15),
            refreshTokenValidity: Duration.days(1),
        })
        this.userPoolClientId = userPoolClient.userPoolClientId
        new CognitoUser(this, `User-${testUser.email}`, {userPool: userPool, ...testUser})
    }
}