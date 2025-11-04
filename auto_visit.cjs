const puppeteer = require("puppeteer");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = "https://idx.google.com/us222-59187885";

const MIN_WAIT_MINUTES = 1;
const MAX_WAIT_MINUTES = 10;
const RUN_DURATION_SEC = 60;
const REFRESH_INTERVAL_SEC = [20, 30];

let visitCount = 0;
let lastVisit = "尚未开始";
let lastStatus = "等待中...";
let running = false;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function visitOnce() {
  running = true;
  visitCount++;
  lastVisit = new Date().toLocaleString("zh-CN");
  console.log(`\n🚀 第 ${visitCount} 次访问开始...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
  );

  const endTime = Date.now() + RUN_DURATION_SEC * 1000;
  let refreshIndex = 1;

  try {
    while (Date.now() < endTime) {
      await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
      lastStatus = `✅ 第 ${refreshIndex} 次刷新成功 (${new Date().toLocaleTimeString()})`;
      console.log(lastStatus);

      const waitSec =
        REFRESH_INTERVAL_SEC[0] +
        Math.floor(Math.random() * (REFRESH_INTERVAL_SEC[1] - REFRESH_INTERVAL_SEC[0]));
      console.log(`⏳ 等待 ${waitSec} 秒后刷新下一次...`);
      await sleep(waitSec * 1000);
      refreshIndex++;
    }
  } catch (err) {
    lastStatus = `❌ 出错：${err.message}`;
    console.log(lastStatus);
  }

  await browser.close();
  running = false;

  const waitMinutes =
    MIN_WAIT_MINUTES + Math.floor(Math.random() * (MAX_WAIT_MINUTES - MIN_WAIT_MINUTES + 1));
  console.log(`🕒 等待 ${waitMinutes} 分钟后进行下一轮访问...\n`);
  setTimeout(visitOnce, waitMinutes * 60 * 1000);
}

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><meta http-equiv="refresh" content="10"></head>
      <body style="font-family:sans-serif;background:#111;color:#eee;text-align:center;padding:40px">
        <h1>🌐 Google IDX 自动访问状态</h1>
        <p><b>目标：</b>${TARGET_URL}</p>
        <p><b>上次访问：</b>${lastVisit}</p>
        <p><b>状态：</b>${lastStatus}</p>
        <p><b>总访问轮次：</b>${visitCount}</p>
        <p><b>运行状态：</b>${running ? "🟢 运行中..." : "🟡 等待中"}</p>
        <p>⏱ 页面每 10 秒自动刷新</p>
      </body>
    </html>
  `);
});

app.listen(PORT, async () => {
  console.log(`✅ 状态页面运行：http://localhost:${PORT}`);
  await visitOnce();
});
