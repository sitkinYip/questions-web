import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const apiPort = process.env.MOCK_API_PORT || "5180";
const webPort = process.env.MOCK_WEB_PORT || "5174";
const apiBase = `http://127.0.0.1:${apiPort}`;

const apiProc = spawn(
  process.execPath,
  [path.join(rootDir, "scripts/mock-api-server.mjs")],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      MOCK_API_PORT: apiPort,
      MOCK_WEB_PORT: webPort,
    },
    stdio: "inherit",
  },
);

const viteBin = path.join(rootDir, "node_modules/.bin/vite");
const webProc = spawn(
  viteBin,
  ["--host", "127.0.0.1", "--port", webPort, "--strictPort"],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      VITE_POCKETBASE_URL: apiBase,
      VITE_API_BASE_URL: `${apiBase}/api/collections`,
      VITE_ANALYTICS_ENABLED: "false",
    },
    stdio: "inherit",
  },
);

console.log("");
console.log("==============================================================");
console.log("  赴星之约（Starward）本地全链路 Mock 沙盒已就绪");
console.log(`  ▶ 应用预览地址：http://127.0.0.1:${webPort}/login`);
console.log(
  `  ▶ Mock 控制台 ：${apiBase}/__mock （重置进度 / 调延迟 / 速查答案）`,
);
console.log(
  "  ▶ 测试账号    ：star / 123456（直达大厅）｜ new / 123456（首次改密）",
);
console.log("==============================================================");
console.log("");

let closing = false;
function shutdown(code = 0) {
  if (closing) return;
  closing = true;
  apiProc.kill("SIGTERM");
  webProc.kill("SIGTERM");
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

apiProc.on("exit", (code) => {
  if (!closing) shutdown(code ?? 1);
});
webProc.on("exit", (code) => {
  if (!closing) shutdown(code ?? 1);
});
