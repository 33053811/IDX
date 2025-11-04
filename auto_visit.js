// auto_visit.js
const axios = require("axios");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 配置 =====
const TARGET_URL = "https://idx.google.com/us222-59187885"; // 目标访问网址
const MIN_WAIT_MINUTES = 1; // 最短等待分钟
const MAX_WAIT_MINUTES = 10; // 最长等待分钟
const REFRESH_INTERVAL_SEC = [20, 30]; // 每次刷新间隔范围
const RUN_DURATION_SEC = 60; // 每轮访问持续 1 分钟

let visitCount = 0;
let lastVisit = "尚未开始";
let lastStatus = "等待中...";
let running = false;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ===== 主循环 =====
async function startVisiting() {
  running = true;
  visitCount++;
  const now = new Date();
  lastVisit = now.toLocaleString("zh-CN");
  console.log(`\n🚀 第 ${visitCount} 次访问开始...`);
  console.log(`🌐 [${lastVisit}] 开始持续访问：${TARGET_URL}`);

  const endTime = Date.now() + RUN_DURATION_SEC * 1000;
  let refreshIndex = 1;

  while (Date.now() < endTime) {
    try {
      const res = await axios.get(TARGET_URL, { timeout: 10000 });
      const t = new Date().toLocaleTimeString();
      lastStatus = `✅ ${t} 第 ${refreshIndex} 次刷新成功 (状态码 ${res.status})`;
      console.log(lastStatus);
    } catch (err) {
      lastStatus = `❌ 第 ${refreshIndex} 次刷新失败: ${err.message}`;
      console.log(lastStatus);
    }

    refreshIndex++;
    const wait = REFRESH_INTERVAL_SEC[0] + Math.floor(Math.random() * (REFRESH_INTERVAL_SEC[1] - REFRESH_INTERVAL_SEC[0]));
    console.log(`⏳ 等待 ${wait} 秒后下一次刷新...`);
    await sleep(wait * 1000);
  }

  console.log(`✅ 第 ${visitCount} 轮访问完成（持续 ${RUN_DURATION_SEC} 秒）`);
  running = false;

  const waitMinutes = MIN_WAIT_MINUTES + Math.floor(Math.random() * (MAX_WAIT_MINUTES - MIN_WAIT_MINUTES + 1));
  console.log(`🕒 等待 ${waitMinutes} 分钟后进行下一轮访问...\n`);
  setTimeout(startVisiting, waitMinutes * 60 * 1000);
}

// ===== Web 状态页面 =====
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="10">
        <style>
          body { font-family: Arial, sans-serif; background: #111; color: #eee; text-align: center; padding: 40px; }
          .card { background: #222; display: inline-block; padding: 20px 40px; border-radius: 12px; box-shadow: 0 0 15px #000; }
          h1 { color: #6cf; }
          p { font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🌐 自动访问状态监控</h1>
          <p><b>目标网址：</b> ${TARGET_URL}</p>
          <p><b>总访问轮次：</b> ${visitCount}</p>
          <p><b>上次访问时间：</b> ${lastVisit}</p>
          <p><b>最近状态：</b> ${lastStatus}</p>
          <p><b>运行状态：</b> ${running ? "🟢 持续访问中..." : "🟡 等待下一轮"}</p>
          <p>⏱ 页面每 10 秒自动刷新</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`✅ Web 状态页面运行中：http://localhost:${PORT}`);
  startVisiting();
});
