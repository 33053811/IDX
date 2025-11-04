import puppeteer from "puppeteer";
import fetch from "node-fetch";

// === 配置部分 ===
const TARGET_URL = "https://idx.google.com/"; // 要访问的网页
const WORKSPACE_NAME = "us222"; // 登录后自动打开的 workspace 名称
const WORKER_URL = "https://idx-alive.wuyuping7262.workers.dev/"; // Cloudflare Worker 地址

// 随机延迟函数
function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1) + min) * 60 * 1000;
  console.log(`🕒 等待 ${ms / 60000} 分钟后再次执行...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 主函数
async function visitOnce() {
  console.log(`🚀 开始访问 ${TARGET_URL} ...`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: 60000 });
    console.log("✅ 页面加载完成");

    // 自动进入目标 workspace（如果存在）
    if (WORKSPACE_NAME) {
      await page.waitForTimeout(3000);
      const link = await page.$x(`//span[contains(text(), '${WORKSPACE_NAME}')]`);
      if (link.length > 0) {
        await link[0].click();
        console.log(`✅ 已点击 workspace: ${WORKSPACE_NAME}`);
      } else {
        console.log(`⚠️ 未找到 workspace: ${WORKSPACE_NAME}`);
      }
    }

    await page.waitForTimeout(10000);
    console.log("🌐 模拟停留 10 秒后关闭浏览器");
  } catch (err) {
    console.error("❌ 访问出错：", err);
  } finally {
    await browser.close();
  }

  // 调用 Worker 触发保活
  try {
    console.log("🔄 调用 Cloudflare Worker 保活...");
    const res = await fetch(WORKER_URL);
    console.log("📨 Worker 返回状态：", res.status);
  } catch (e) {
    console.log("⚠️ Worker 保活失败：", e.message);
  }

  // 随机等待后重新运行
  await randomDelay(1, 30);
  await visitOnce();
}

// 启动
visitOnce();
