const puppeteer = require("puppeteer");
const fs = require("fs");
const STATUS_FILE = "status.json";
const PID_FILE = "visit.pid";
const TARGET_URL = "https://idx.google.com/us222-59187885";

async function visitOnce() {
  const timestamp = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  let status = {
    time: timestamp,
    url: TARGET_URL,
    result: "运行中",
    refreshes: 0
  };

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    console.log(`🌐 [${timestamp}] 打开：${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    status.result = "✅ 首次访问成功";

    // 保持 1 分钟并随机刷新 2～3 次
    const refreshCount = Math.floor(Math.random() * 2) + 2; // 2~3
    for (let i = 0; i < refreshCount; i++) {
      await new Promise(r => setTimeout(r, 20000)); // 每20秒刷新
      await page.reload({ waitUntil: "domcontentloaded" });
      console.log(`🔁 第 ${i + 1} 次刷新成功`);
      status.refreshes++;
    }

    await new Promise(r => setTimeout(r, 10000)); // 多停留10秒
    await browser.close();
    console.log(`✅ [${timestamp}] 访问结束，共刷新 ${status.refreshes} 次。`);
  } catch (err) {
    status.result = "❌ 出错：" + err.message;
    console.error(status.result);
  }

  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  return status;
}

// 循环任务
async function loopVisit() {
  fs.writeFileSync(PID_FILE, process.pid.toString());
  while (true) {
    await visitOnce();
    const waitMin = Math.floor(Math.random() * 10) + 1;
    console.log(`⏳ 等待 ${waitMin} 分钟后重试...\n`);
    await new Promise(r => setTimeout(r, waitMin * 60000));
  }
}

// 检查是否已有任务在运行
function isRunning() {
  if (!fs.existsSync(PID_FILE)) return false;
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE).toString(), 10);
    process.kill(pid, 0);
    return true; // 存在正在运行的任务
  } catch {
    return false; // 无效 PID，说明未运行
  }
}

// 主逻辑
(async () => {
  if (isRunning()) {
    console.log("✅ 检测到访问任务正在运行，跳过启动。");
  } else {
    console.log("⚙️ 未检测到访问任务，启动新循环。");
    await loopVisit();
  }
})();
