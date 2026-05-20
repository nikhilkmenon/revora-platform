/**
 * Runtime environment configuration.
 * Statically reads NEXT_PUBLIC_ env vars for safe client-side bundling.
 */

const getApiUrl = (): string => {
  // Static access enables compiler text replacement, and we provide a safe fallback for the live environment.
  return process.env.NEXT_PUBLIC_API_URL || "https://revora-api-895912323169.us-central1.run.app/api/v1";
};

export const env = {
  // API base URL — required. Set to your backend URL in production.
  apiUrl: getApiUrl(),

  // App environment
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",

  // Public app metadata
  appName: process.env.NEXT_PUBLIC_APP_NAME || "REVORA",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;

export type Env = typeof env;

