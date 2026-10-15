import { spawn } from "node:child_process";
import { join } from "node:path";

const target = join(process.cwd(), "frontend", "scripts", "verify-all.mjs");
const child = spawn("node", [target], {
  cwd: join(process.cwd(), "frontend"),
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
