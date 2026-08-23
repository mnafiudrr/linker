import { defineConfig } from "drizzle-kit";

import { getEnv } from "./src/lib/env";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getEnv().DATABASE_URL,
  },
});
