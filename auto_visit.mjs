import puppeteer from "puppeteer";

// 配置
const TARGET_URL = "https://idx.google.com/"; // 目标主页（如需精确到 workspace，可在脚本内点击）
const WORKER_URL = "https://idx-alive.wuyuping7262.workers.dev/"; // 可选：Cloudflare Worker 保活地址（不需要可置空）
const RUN_KEEP_MS = 60 * 1000; // 每次停留总时长：60秒
const MIN_DELAY_MIN = 1; // 随机等待最小分钟
const MAX_DELAY_MIN = 10; // 随机等待最大分钟

// 工具：随机整数（含端点）
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 工具：sleep
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function visitOnce() {
  console.log(`\n🚀 [${new Date().toLocaleString()}] 开始访问：${TARGET_URL}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );

    // 打开页面（等待网络空闲）
    await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: 60000 });
    console.log("✅ 页面加载完成");

    // 在 60 秒内刷新 2~3 次（均匀分布）
    const refreshCount = randInt(2, 3);
    const interval = Math.floor(RUN_KEEP_MS / (refreshCount + 1)); // 每次间隔：均分
    for (let i = 0; i < refreshCount; i++) {
      console.log(`⏱ 等待 ${interval / 1000}s 后刷新（第 ${i + 1}/${refreshCount} 次）`);
      await sleep(interval);
      try {
        await page.reload({ waitUntil: "networkidle2", timeout: 60000 });
        console.log(`🔁 刷新 ${i + 1} 成功`);
      } catch (err) {
        console.warn(`⚠️ 刷新 ${i + 1} 出错：`, err.message);
      }
    }
    // 停留剩余时间
    const remaining = RUN_KEEP_MS - interval * refreshCount;
    if (remaining > 0) {
      console.log(`⏱ 停留剩余 ${Math.round(remaining / 1000)} 秒`);
      await sleep(remaining);
    }

    console.log("✅ 本次保持/刷新完成，准备关闭浏览器");
  } catch (err) {
    console.error("❌ 访问出错：", err && err.message ? err.message : err);
  } finally {
    await browser.close();
  }

  // 可选：调用 Cloudflare Worker 以便唤醒/保活（如果你配置了）
  if (WORKER_URL) {
    try {
      const res = await fetch(WORKER_URL);
      console.log("🔄 调用 Worker 保活，返回状态：", res.status);
    } catch (e) {
      console.warn("⚠️ 调用 Worker 失败：", e.message);
    }
  }

  // 随机等待 1～10 分钟后再次执行
  const waitMin = randInt(MIN_DELAY_MIN, MAX_DELAY_MIN);
  console.log(`⏳ 随机等待 ${waitMin} 分钟后再次执行 (${new Date(Date.now() + waitMin * 60000).toLocaleTimeString()})`);
  await sleep(waitMin * 60 * 1000);
}

(async () => {
  // 持续循环（注意：在 GitHub Actions 中单次 job 有超时限制；通常把 workflow 定时触发与脚本内部循环结合使用）
  while (true) {
    await visitOnce();
  }
})();
