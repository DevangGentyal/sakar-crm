import { Pool, PoolClient } from "pg";
import { env } from "./env";

const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
  ssl: env.isProduction ? { rejectUnauthorized: true } : false,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err);
  process.exit(1);
});

/**
 * Run a parameterized query against the pool.
 */
export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[],
): Promise<import("pg").QueryResult<T>> {
  const result = await pool.query<T>(text, params);
  return result;
}

/**
 * Acquire a client from the pool for manual transactions.
 * Always call client.release() in a finally block.
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Verify the DB connection — used in health checks.
 */
export async function ping(): Promise<void> {
  await pool.query("SELECT 1");
}

export default pool;
