import { Construct } from 'constructs'
import { CognitoUserPoolsAuthorizer, IAuthorizer, LambdaIntegration, Resource } from 'aws-cdk-lib/aws-apigateway'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { join } from 'path'
import { AccountRecovery, UserPool } from 'aws-cdk-lib/aws-cognito'
import { RemovalPolicy } from 'aws-cdk-lib'
import { CognitoUser } from '../common/cognito-user'
import { globalCommonLambdaProps } from '../cdk.consts'
import {UserMgmtParams} from '../types';

type UserMgmtProps = Readonly<{
    envName: string
    restApiV1Resource: Resource
    userMgmt: UserMgmtParams
    logRetention: RetentionDays
}>

export class UserMgmt extends Construct {

    readonly authorizer: IAuthorizer
    readonly userPool: UserPool

    constructor(scope: Construct,
                id: string,
                {
                    envName,
                    restApiV1Resource,
                    userMgmt: {
                        adminUsers,
                        autoConfirmedEmails,
                    },
                    logRetention
                }: UserMgmtProps) {
        super(scope, id)

        const commonProps: Partial<NodejsFunctionProps> = {
            ...globalCommonLambdaProps,
            logRetention,
        }

        const usersResource = restApiV1Resource.addResource('users')

        const preSignupFunc = new NodejsFunction(this, 'PreSignupFunc', {
            description: 'Pre signing up user',
            entry: join(__dirname, 'lambdas', 'pre-signup.ts'),
            environment: {
                AUTO_CONFIRMED_EMAILS: autoConfirmedEmails.join(','),
            },
            ...commonProps
        })
        this.userPool = new UserPool(this, 'UserPool', {
            userPoolName: `${envName}-UserPool`,
            selfSignUpEnabled: true,
            signInAliases: {
                email: true
            },
            lambdaTriggers: {
                preSignUp: preSignupFunc,
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
            cognitoUserPools: [this.userPool],
        })

        adminUsers.forEach(user => {
            new CognitoUser(this, `User-${user.email}`, {userPool: this.userPool, ...user})
        })

        const getAllUsersFunc = new NodejsFunction(this, 'GetAllUsersFunc', {
            description: 'List users',
            entry: join(__dirname, 'lambdas', 'get-all.ts'),
            environment: {
                USER_POOL_ID: this.userPool.userPoolId,
            },
            ...commonProps
        })
        usersResource.addMethod('GET', new LambdaIntegration(getAllUsersFunc), {
            authorizer: this.authorizer
        })
        this.userPool.grant(getAllUsersFunc, 'cognito-idp:ListUsers')

        const userByIdResource = usersResource.addResource('{id}')
        const getUserFunc = new NodejsFunction(this, 'GetUserFunc', {
            description: 'Get a user',
            entry: join(__dirname, 'lambdas', 'get.ts'),
            environment: {
                USER_POOL_ID: this.userPool.userPoolId,
            },
            ...commonProps
        })
        userByIdResource.addMethod('GET', new LambdaIntegration(getUserFunc), {
            authorizer: this.authorizer,
        })
        this.userPool.grant(getUserFunc, 'cognito-idp:ListUsers')
    }
}