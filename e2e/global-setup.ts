import { execFileSync } from "child_process";

export default function globalSetup() {
  execFileSync(process.execPath, ["scripts/seed-e2e.mjs"], { stdio: "inherit" });
}
