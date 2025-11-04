const puppeteer = require("puppeteer");
const fs = require("fs");

const TARGET_URL = "https://idx.google.com/us222-59187885";
const STATUS_FILE = "status.json";

async function visit() {
  const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  let status = { time: timestamp, url: TARGET_URL, result: "", refreshes: 0 };

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    console.log(`🌐 [${timestamp}] 正在访问：${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    status.result = "✅ 首次访问成功";

    const refreshTimes = Math.floor(Math.random() * 2) + 2; // 2~3次刷新
    for (let i = 0; i < refreshTimes; i++) {
      await new Promise(r => setTimeout(r, 20000)); // 每20秒刷新
      await page.reload({ waitUntil: "domcontentloaded" });
      console.log(`🔁 第 ${i + 1} 次刷新成功`);
      status.refreshes++;
    }

    await new Promise(r => setTimeout(r, 10000)); // 额外停留10秒
    await browser.close();

    console.log(`✅ [${timestamp}] 访问结束，共刷新 ${status.refreshes} 次。`);
  } catch (err) {
    status.result = "❌ 出错：" + err.message;
    console.error(status.result);
  }

  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  return status;
}

(async () => {
  while (true) {
    const res = await visit();
    const waitMin = Math.floor(Math.random() * 10) + 1;
    console.log(`⏳ 等待 ${waitMin} 分钟后自动重试...\n`);
    await new Promise(r => setTimeout(r, waitMin * 60000));
  }
})();
