// auto_visit.js
const axios = require("axios");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 配置 =====
const TARGET_URL = "https://idx.google.com/us222-59187885"; // 目标访问网址
const MIN_WAIT_MINUTES = 1; // 最短等待 1 分钟
const MAX_WAIT_MINUTES = 10; // 最长等待 10 分钟

let lastVisit = null;
let lastStatus = null;
let running = false;

// ===== 模拟访问逻辑 =====
async function visitWebsite() {
  try {
    running = true;
    lastVisit = new Date().toLocaleString("zh-CN");
    console.log(`🌐 [${lastVisit}] 开始访问：${TARGET_URL}`);

    // 在 1 分钟内访问 2～3 次
    const visitCount = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < visitCount; i++) {
      const startTime = new Date().toLocaleTimeString();
      const res = await axios.get(TARGET_URL, { timeout: 10000 });
      lastStatus = `✅ ${startTime} 第 ${i + 1}/${visitCount} 次访问返回状态：${res.status}`;
      console.log(lastStatus);

      if (i < visitCount - 1) {
        const wait = 20 + Math.floor(Math.random() * 10);
        console.log(`⏳ 等待 ${wait} 秒后刷新...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
      }
    }

    console.log(`✅ 访问结束，持续 1 分钟。`);
  } catch (err) {
    lastStatus = `❌ 错误：${err.message}`;
    console.error(lastStatus);
  } finally {
    running = false;

    // 随机等待 1～10 分钟后重新访问
    const waitMinutes = MIN_WAIT_MINUTES + Math.floor(Math.random() * (MAX_WAIT_MINUTES - MIN_WAIT_MINUTES + 1));
    console.log(`⏳ 等待 ${waitMinutes} 分钟后再次访问...\n`);
    setTimeout(visitWebsite, waitMinutes * 60 * 1000);
  }
}

// ===== Web 界面 =====
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="10">
        <style>
          body { font-family: sans-serif; background: #111; color: #eee; text-align: center; padding-top: 40px; }
          .card { background: #222; display: inline-block; padding: 20px 40px; border-radius: 12px; box-shadow: 0 0 15px #000; }
          h1 { color: #6cf; }
          p { font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🌐 自动访问状态监控</h1>
          <p><b>目标网址：</b> ${TARGET_URL}</p>
          <p><b>上次访问时间：</b> ${lastVisit || "尚未开始"}</p>
          <p><b>最近状态：</b> ${lastStatus || "等待中..."}</p>
          <p><b>运行状态：</b> ${running ? "🟢 进行中" : "🟡 等待下一次"}</p>
          <p>⏱ 页面每 10 秒自动刷新</p>
        </div>
      </body>
    </html>
  `);
});

// 启动 Web 服务器
app.listen(PORT, () => {
  console.log(`🚀 Web 界面已启动：http://localhost:${PORT}`);
  visitWebsite(); // 自动开始循环访问
});
