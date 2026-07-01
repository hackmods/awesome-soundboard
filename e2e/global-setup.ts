import { execSync } from "child_process";

export default function globalSetup() {
  execSync("npm run test:fixtures", { stdio: "inherit", cwd: process.cwd() });
}
