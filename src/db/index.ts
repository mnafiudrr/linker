import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getEnv } from "@/lib/env";
import * as schema from "./schema";

type Database = ReturnType<typeof createDb>;

export type { Database };

let database: Database | undefined;

function createDb() {
  return drizzle(postgres(getEnv().DATABASE_URL), { schema });
}

export function getDb(): Database {
  database ??= createDb();
  return database;
}

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export { schema };
