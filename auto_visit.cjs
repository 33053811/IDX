// auto_visit.cjs
const puppeteer = require("puppeteer");

(async () => {
  const url = "https://idx.google.com/us222-59187885";
  const keepAliveTime = 60 * 1000; // 1分钟
  const refreshTimes = Math.floor(Math.random() * 2) + 2; // 刷新2~3次

  console.log(`🌐 [${new Date().toLocaleString()}] 打开：${url}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });

  for (let i = 1; i <= refreshTimes; i++) {
    const waitTime = keepAliveTime / (refreshTimes + 1);
    await new Promise((r) => setTimeout(r, waitTime));
    await page.reload({ waitUntil: "domcontentloaded" });
    console.log(`🔁 刷新第 ${i}/${refreshTimes} 次`);
  }

  await new Promise((r) => setTimeout(r, keepAliveTime / (refreshTimes + 1)));
  await browser.close();
  console.log("✅ 已完成本次访问，等待下次 GitHub Actions 自动触发。");
})();
