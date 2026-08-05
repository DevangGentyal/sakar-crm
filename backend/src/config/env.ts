import dotenv from "dotenv";

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: parseInt(optional("PORT", "4000"), 10),

  DB_HOST: required("DB_HOST"),
  DB_PORT: parseInt(optional("DB_PORT", "5432"), 10),
  DB_NAME: required("DB_NAME"),
  DB_USER: required("DB_USER"),
  DB_PASSWORD: required("DB_PASSWORD"),
  DB_POOL_MAX: parseInt(optional("DB_POOL_MAX", "20"), 10),
  DB_IDLE_TIMEOUT_MS: parseInt(optional("DB_IDLE_TIMEOUT_MS", "30000"), 10),
  DB_CONNECTION_TIMEOUT_MS: parseInt(
    optional("DB_CONNECTION_TIMEOUT_MS", "2000"),
    10,
  ),

  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "7d"),
  REGISTRATION_PASSWORD: optional("REGISTRATION_PASSWORD", ""),

  CORS_ORIGIN: optional("CORS_ORIGIN", "http://localhost:3000"),

  EXOTEL_API_KEY: optional("EXOTEL_API_KEY", ""),
  EXOTEL_API_TOKEN: optional("EXOTEL_API_TOKEN", ""),
  EXOTEL_ACCOUNT_SID: optional("EXOTEL_ACCOUNT_SID", ""),
  EXOTEL_CALLER_ID: optional("EXOTEL_CALLER_ID", ""),
  EXOTEL_REGION: optional("EXOTEL_REGION", "mumbai"),
  EXOTEL_STATUS_CALLBACK_URL: optional("EXOTEL_STATUS_CALLBACK_URL", ""),
  SMTP_EMAIL: optional("SMTP_EMAIL", ""),
  SMTP_APP_PASSWORD: optional("SMTP_APP_PASSWORD", ""),
  FRONTEND_URL: optional("FRONTEND_URL", "http://localhost:3000"),
  STORAGE_PROVIDER: optional("STORAGE_PROVIDER", "local"),
  AWS_REGION: optional("AWS_REGION", ""),
  AWS_ACCESS_KEY_ID: optional("AWS_ACCESS_KEY_ID", ""),
  AWS_SECRET_ACCESS_KEY: optional("AWS_SECRET_ACCESS_KEY", ""),
  AWS_S3_BUCKET: optional("AWS_S3_BUCKET", ""),
  PUBLIC_BASE_URL: optional("PUBLIC_BASE_URL", "http://localhost:4000"),

  isProduction: optional("NODE_ENV", "development") === "production",
  isDevelopment: optional("NODE_ENV", "development") === "development",
} as const;
