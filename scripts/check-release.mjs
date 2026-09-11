import { spawnSync } from "node:child_process";

// CI and local completion use exactly the same gates and browser engines.
const env = {
  ...process.env,
  CI: "true",
  E2E_PORT: process.env.E2E_PORT || "5184",
};
function run(command, args) {
  console.log(`\nRelease gate: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
for (const script of ["format:check", "check:styles", "check:motion", "lint"])
  run("pnpm", [script]);
run("pnpm", ["test:run", "--maxWorkers=2"]);
for (const mode of ["preview", "production"]) {
  run("pnpm", [`build:${mode}`]);
  run("node", ["scripts/verify-build-artifact.mjs", mode]);
}
run("pnpm", ["test:e2e"]);
run("pnpm", [
  "exec",
  "playwright",
  "test",
  "e2e/music-control.spec.ts",
  "e2e/bless-flow.spec.ts",
  "e2e/motion.spec.ts",
  "--project=mobile-webkit",
]);
run("pnpm", ["format:check"]);
console.log(
  "\nAll release gates passed. This command does not upload or deploy files.",
);
