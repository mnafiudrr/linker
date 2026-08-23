import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  baseURL: getEnv().BETTER_AUTH_URL,
  secret: getEnv().BETTER_AUTH_SECRET,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
});

export type Session = typeof auth.$Infer.Session;
