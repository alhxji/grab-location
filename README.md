# tg-locator

Grabs the visitor's GPS coordinates and device details, then sends everything to a Telegram chat. After sending, the page goes blank.

## What gets sent

- Full address (reverse geocoded via OpenStreetMap)
- Lat/lng, accuracy, altitude, heading, speed
- Device, browser, OS
- IP address
- Screen resolution, pixel ratio
- Connection type, downlink, RTT
- Battery level & charging status
- Language, timezone, referrer, cores, RAM, touch points
- Google Maps link

## Setup

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather) and copy the token.

2. Get your chat ID:
   - Add the bot to your group
   - Send any message in the group
   - Open `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Find `"chat":{"id": -XXXXXXXXXX}` — that's your chat ID (negative for groups)

3. Create `.env.local` in the project root:

```
TG_BOT_TOKEN=your_bot_token_here
TG_CHAT_ID=your_chat_id_here
```

4. Install and run:

```bash
pnpm i
pnpm dev
```

## Deploy

Works on Vercel, Netlify, or any platform that supports Next.js. Make sure to set the env vars there too.
