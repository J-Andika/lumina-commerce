import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["./src/server/testing/global-setup.ts"],
    env: {
      DATABASE_URL: "file:./prisma/test.db",
    },
    testTimeout: 20_000,
    // One shared SQLite test database: run files sequentially so order tests cannot
    // race catalogue assertions.
    fileParallelism: false,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
