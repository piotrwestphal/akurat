import {HttpError, post} from 'http-client'

type SnsEvent = Readonly<{
    Records: Array<Readonly<{Sns: Array<any>}>>
}>

const webhookUrl = process.env.WEBHOOK_URL as string
export const handler = async (ev: SnsEvent) => {
    ev.Records.forEach(v => {
        console.log('EVENT', v)
    })
    const message = 'Alarm!!'
    ev.Records.flatMap(v => v.Sns).forEach(v => {
        console.log('VALUE', v)
    })

    try {
        await post(webhookUrl, {}, {content: message})
        return 'Notification sent to Discord.'
    } catch (err) {
        console.error('Error sending notification:', err)
        const {code, message, status} = err as HttpError
        console.error({code, message, status})
        throw new Error('Failed to send notification to Discord.')
    }
}