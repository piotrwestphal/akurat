import { Construct } from 'constructs'
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources'
import { CfnUserPoolUserToGroupAttachment, IUserPool } from 'aws-cdk-lib/aws-cognito'

type CognitoUserProps = Readonly<{
    userPool: IUserPool,
    email: string,
    password: string,
    groupName?: string,
}>

export class CognitoUser extends Construct {

    constructor(scope: Construct,
                id: string,
                {
                    userPool,
                    email,
                    password,
                    groupName,
                }: CognitoUserProps) {
        super(scope, id)

        // Create the user inside the Cognito user pool using Lambda backed AWS Custom resource
        const adminCreateUser = new AwsCustomResource(this, 'CognitoCreateUserCR', {
            onUpdate: {
                service: 'CognitoIdentityServiceProvider',
                action: 'adminCreateUser',
                parameters: {
                    UserPoolId: userPool.userPoolId,
                    Username: email,
                    MessageAction: 'SUPPRESS',
                    TemporaryPassword: password,
                },
                physicalResourceId: PhysicalResourceId.of(`CognitoCreateUserCR-${email}`),
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({resources: AwsCustomResourcePolicy.ANY_RESOURCE}),
        })

        // Force the password for the user, because by default when new users are created
        // they are in FORCE_PASSWORD_CHANGE status. The newly created user has no way to change it though
        const adminSetUserPassword = new AwsCustomResource(this, 'CognitoSetPasswordCR', {
            onUpdate: {
                service: 'CognitoIdentityServiceProvider',
                action: 'adminSetUserPassword',
                parameters: {
                    UserPoolId: userPool.userPoolId,
                    Username: email,
                    Password: password,
                    Permanent: true,
                },
                physicalResourceId: PhysicalResourceId.of(`CognitoSetPasswordCR-${email}`),
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({resources: AwsCustomResourcePolicy.ANY_RESOURCE}),
        })
        adminSetUserPassword.node.addDependency(adminCreateUser)

        // If a Group Name is provided, also add the user to this Cognito UserPool Group
        if (groupName) {
            const userToGroupAttachment = new CfnUserPoolUserToGroupAttachment(this, 'AttachToGroup', {
                userPoolId: userPool.userPoolId,
                groupName: groupName,
                username: email,
            })
            userToGroupAttachment.node.addDependency(adminCreateUser)
            userToGroupAttachment.node.addDependency(adminSetUserPassword)
            userToGroupAttachment.node.addDependency(userPool)
        }
    }
}
