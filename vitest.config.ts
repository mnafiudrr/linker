import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Allow server-only modules to be imported in tests.
      "server-only": new URL("./src/test/server-only-stub.ts", import.meta.url).pathname,
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    hookTimeout: 30_000,
  },
});
