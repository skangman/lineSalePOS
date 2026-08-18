import { Router } from 'express'
import * as line from '@line/bot-sdk'
import { query, queryOne } from '../config/db.js'

const router = Router()

const middlewareConfig: line.MiddlewareConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
}

router.post('/webhook', line.middleware(middlewareConfig), async (req, res) => {
  const events: line.WebhookEvent[] = req.body.events

  res.status(200).json({ message: 'OK' })

  const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  })

  for (const event of events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue

    const lineUserId = event.source.userId
    if (!lineUserId) continue

    const text = (event.message as line.TextEventMessage).text.trim()

    if (text === 'สมัครร้าน' || text === 'register') {
      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{
          type: 'text',
          text: 'กรุณากดเมนู "สมัครร้านค้า" ด้านล่างเพื่อเปิดหน้าสมัครร้านค่ะ',
        }],
      })
    }
  }
})

export default router
