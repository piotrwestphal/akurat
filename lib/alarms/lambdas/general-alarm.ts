import {HttpError, post} from 'http-client'
import {AlarmMessage} from '../../types'
// {
//   "username": "Webhook",
//   "avatar_url": "https://i.imgur.com/4M34hi2.png",
//   "content": "Text message. Up to 2000 characters.",
//   "embeds": [
//     {
//       "author": {
//         "name": "Birdie♫",
//         "url": "https://www.reddit.com/r/cats/",
//         "icon_url": "https://i.imgur.com/R66g1Pe.jpg"
//       },
//       "title": "Title",
//       "url": "https://google.com/",
//       "description": "Text message. You can use Markdown here. *Italic* **bold** __underline__ ~~strikeout~~ [hyperlink](https://google.com) `code`",
//       "color": 15258703,
//       "fields": [
//         {
//           "name": "Text",
//           "value": "More text",
//           "inline": true
//         },
//         {
//           "name": "Even more text",
//           "value": "Yup",
//           "inline": true
//         },
//         {
//           "name": "Use `\"inline\": true` parameter, if you want to display fields in the same line.",
//           "value": "okay..."
//         },
//         {
//           "name": "Thanks!",
//           "value": "You're welcome :wink:"
//         }
//       ],
//       "thumbnail": {
//         "url": "https://upload.wikimedia.org/wikipedia/commons/3/38/4-Nature-Wallpapers-2014-1_ukaavUI.jpg"
//       },
//       "image": {
//         "url": "https://upload.wikimedia.org/wikipedia/commons/5/5a/A_picture_from_China_every_day_108.jpg"
//       },
//       "footer": {
//         "text": "Woah! So cool! :smirk:",
//         "icon_url": "https://i.imgur.com/fKL31aD.jpg"
//       }
//     }
//   ]
// }
type SnsLambdaEvent = Readonly<{
    Records: Array<
        Readonly<{
            Sns: SnsEvent
        }>>
}>

type SnsEvent = Readonly<{
    Type: string
    MessageId: string
    TopicArn: string
    Subject: string
    Message: string
    Timestamp: string
    MessageAttributes: Record<string, { Type: string, Value: string }>
}>

const webhookUrl = process.env.WEBHOOK_URL as string
export const handler = async (ev: SnsLambdaEvent) => {
    const events: SnsEvent[] = ev.Records.map(v => v.Sns)
    events.forEach((ev, idx) => {
        console.debug(`Incoming event [${idx}]`, ev)
    })

    try {
        for (const ev of events) {
            const msg = JSON.parse(ev.Message) as AlarmMessage
            // TODO: format message https://gist.github.com/Birdie0/78ee79402a4301b1faf412ab5f1cdcf9
            await post(webhookUrl, {}, {content: `${msg.source}: ${msg.payload.message}. Details: ${msg.payload.details}`})
        }
        return 'Notifications sent'
    } catch (err) {
        console.error('Error sending notification', err)
        const {code, message, status} = err as HttpError
        console.error({code, message, status})
        throw new Error('Failed to send notification')
    }
}