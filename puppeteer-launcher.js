// puppeteer-launcher.js
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const CONFIG_PATH = './users.json'; // Array of 100 SIP user objects
const CLIENT_URL = 'http://localhost:8081/client.html';
const MAX_CONCURRENCY = 2; // Launch in batches

async function launchClient(user, index) {
  const browser = await puppeteer.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();

  // Inject credentials using page.evaluateOnNewDocument
  await page.evaluateOnNewDocument((creds) => {
    window.SIP_CREDS = creds;
  }, user);

  await page.goto(CLIENT_URL);
  console.log(`Launched client ${index}: ${user.username}`);
  return browser; // Keep browsers alive
}

async function main() {
  const users = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
  const launched = [];

  for (let i = 0; i < users.length; i += MAX_CONCURRENCY) {
    const batch = users.slice(i, i + MAX_CONCURRENCY);
    const results = await Promise.all(batch.map((user, idx) => launchClient(user, i + idx)));
    launched.push(...results);
    await new Promise((r) => setTimeout(r, 2000)); // Stagger batches
  }

  console.log(`Launched ${launched.length} SIP clients.`);
}

main();
