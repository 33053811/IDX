import axios from "axios";
import fs from "fs-extra";

const TARGET_URL = "https://idx.google.com/us222-59187885";
const MIN_WAIT = 1; // 最少等待分钟
const MAX_WAIT = 10; // 最多等待分钟
const HOLD_TIME = 60 * 1000; // 每次保持访问 1 分钟
const STATUS_FILE = "./status.json";

async function visit() {
  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  let status = "N/A";
  console.log(`🌐 [${now}] 访问：${TARGET_URL}`);

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), HOLD_TIME);

    const response = await axios.get(TARGET_URL, {
      timeout: HOLD_TIME + 5000,
      signal: controller.signal,
    });
    status = `✅ ${response.status}`;
    console.log(`✅ 返回状态：${response.status}`);
  } catch (err) {
    status = `❌ ${err.message}`;
    console.log(`❌ 出错：${err.message}`);
  }

  // 读取历史数据
  let data = {};
  if (await fs.pathExists(STATUS_FILE)) {
    data = await fs.readJson(STATUS_FILE);
  }

  const total = (data.total || 0) + 1;
  const waitMinutes = Math.floor(Math.random() * (MAX_WAIT - MIN_WAIT + 1)) + MIN_WAIT;
  const nextRun = new Date(Date.now() + waitMinutes * 60 * 1000).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  // 更新状态
  const newData = {
    lastVisit: now,
    lastStatus: status,
    nextRun,
    nextWait: waitMinutes,
    total,
  };
  await fs.writeJson(STATUS_FILE, newData, { spaces: 2 });

  console.log(`⏳ 等待 ${waitMinutes} 分钟后自动重试...\n`);
}

await visit();
