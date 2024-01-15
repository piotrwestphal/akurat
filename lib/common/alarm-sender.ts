import {PublishCommand, SNSClient} from '@aws-sdk/client-sns'
import {AlarmMessage} from '../types'

export const sendAlarm = (snsClient: SNSClient,
                          topicArn: string,
                          message: AlarmMessage) =>
    snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(message),
    }))