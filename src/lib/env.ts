import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .startsWith("postgres://", { message: "DATABASE_URL must be a postgres connection string" }),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(16),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= envSchema.parse(process.env);
  return cached;
}
