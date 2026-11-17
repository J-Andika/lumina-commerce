import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

/**
 * Test database: a throwaway SQLite file at prisma/test.db,
 * migrated from prisma/migrations and filled by the real seed script.
 *
 * Child processes are spawned with the current Node binary and the CLI entry
 * points directly — spawning `npx.cmd` fails with EINVAL on modern Node/Windows.
 */
export default function setup() {
  const databaseUrl = "file:./prisma/test.db";
  const dbFile = path.resolve("prisma/test.db");

  for (const file of [dbFile, `${dbFile}-journal`, `${dbFile}-wal`, `${dbFile}-shm`]) {
    rmSync(file, { force: true });
  }

  const env = { ...process.env, DATABASE_URL: databaseUrl };
  const options = { env, stdio: "inherit" as const };
  const prismaCli = path.resolve("node_modules", "prisma", "build", "index.js");
  const tsxCli = path.resolve("node_modules", "tsx", "dist", "cli.mjs");

  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], options);
  execFileSync(process.execPath, [tsxCli, "prisma/seed.ts"], options);
}
