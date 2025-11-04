// 自动访问 + 随机刷新 + 随机间隔执行
import puppeteer from "puppeteer";

const target = "https://idx.google.com/us222-59187885";

// 随机整数工具
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {
  console.log(`🌐 [${new Date().toLocaleString()}] 打开：${target}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(target, { waitUntil: "networkidle2", timeout: 60000 });

    const refreshTimes = rand(2, 3);
    console.log(`🔄 保持 1 分钟，期间刷新 ${refreshTimes} 次`);

    for (let i = 0; i < refreshTimes; i++) {
      const delay = rand(15, 25) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      console.log(`🔁 刷新第 ${i + 1}/${refreshTimes} 次`);
      await page.reload({ waitUntil: "networkidle2", timeout: 60000 });
    }

    await new Promise((r) => setTimeout(r, 10000));
  } catch (err) {
    console.error("❌ 出错：", err.message);
  } finally {
    await browser.close();
  }

  // 生成 1～10 分钟随机间隔
  const nextDelay = rand(1, 10);
  console.log(`⏳ ${nextDelay} 分钟后将由 GitHub Actions 自动再次触发`);

  // 这里不等待，由 GitHub Actions 定时器重新调度
})();
