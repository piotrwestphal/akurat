import {NodejsFunction, NodejsFunctionProps} from 'aws-cdk-lib/aws-lambda-nodejs'
import {RetentionDays} from 'aws-cdk-lib/aws-logs'
import {Topic} from 'aws-cdk-lib/aws-sns'
import {LambdaSubscription} from 'aws-cdk-lib/aws-sns-subscriptions'
import {Construct} from 'constructs'
import {join} from 'path'
import {globalCommonLambdaProps} from '../cdk.consts'
import {awsSdkV3ModuleName} from '../consts'
import {LambdaLayerDef} from '../types'

type AlarmsProps = Readonly<{
    alarmsTopic: Topic
    httpLayer: LambdaLayerDef
    logRetention: RetentionDays
}>

export class Alarms extends Construct {

    constructor(scope: Construct,
                id: string,
                {
                    alarmsTopic,
                    httpLayer,
                    logRetention,
                }: AlarmsProps) {
        super(scope, id)

        const commonProps: Partial<NodejsFunctionProps> = {
            ...globalCommonLambdaProps,
            logRetention,
        }

        const generalAlarmFunc = new NodejsFunction(this, 'GeneralAlarmFunc', {
            description: 'Send a general alarm',
            entry: join(__dirname, 'lambdas', 'general-alarm.ts'),
            bundling: {
                // need to list all modules that should not be bundled
                externalModules: [httpLayer.moduleName, awsSdkV3ModuleName],
            },
            layers: [httpLayer.layerVer],
            environment: {
                WEBHOOK_URL: 'https://discord.com/api/webhooks/1187311517545267221/os42C_jRsANQS9o1oHQoIvgNSGpv4jVRiKEzjhjrHxQQ69HE97JJSXno-1gd11LU1xWO',
            },
            ...commonProps,
        })

        alarmsTopic.addSubscription(new LambdaSubscription(generalAlarmFunc))
    }
}