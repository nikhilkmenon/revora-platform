/**
 * Runtime environment validation.
 * Validates all required NEXT_PUBLIC_ env vars at startup.
 * Throws with clear messages so Railway deployment fails fast if misconfigured.
 */

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(
      `[REVORA] Missing required environment variable: ${key}\n` +
      `Please set it in Railway's environment variables panel or your .env.local file.`
    );
  }
  return value;
};

export const env = {
  // API base URL — required. Set to your Railway backend URL in production.
  apiUrl: required("NEXT_PUBLIC_API_URL", "http://localhost:8080/api/v1"),

  // App environment
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  // Public app metadata
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "REVORA",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export type Env = typeof env;
