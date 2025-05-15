# SIP.js WebRTC Automation

This project simulates SIP calls over WSS using headless Chrome and SIP.js.

## Features

- SIP registration using SIP.js
- Audio-only call simulation
- Auto redial with hangup after 10s
- Role-based logic for caller/callee
- Scales to 100 clients via Puppeteer

## Setup

```bash
git clone https://github.com/yourname/sipjs-webrtc-automation.git
cd sipjs-webrtc-automation
npm install
npm run build

