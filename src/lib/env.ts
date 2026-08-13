export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const DEFAULT_DEV_SITE_URL = "http://localhost:3000";
export const DEFAULT_PROD_SITE_URL = "https://plotripple.quest";
export const GEMINI_TIMEOUT_MS = 25_000;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60 * 24;

export type EnvSource = Record<string, string | undefined>;

export function isProductionRuntime(env: EnvSource = process.env): boolean {
  return env.NODE_ENV === "production";
}

export function getSiteUrl(env: EnvSource = process.env): string {
  const raw = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) {
    return isProductionRuntime(env) ? DEFAULT_PROD_SITE_URL : DEFAULT_DEV_SITE_URL;
  }
  return raw.replace(/\/+$/, "");
}

export function getPublicTurnstileSiteKey(
  env: EnvSource = process.env,
): string | undefined {
  const value = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return value ? value : undefined;
}

export function getGaMeasurementId(env: EnvSource = process.env): string | undefined {
  const value = env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return value ? value : undefined;
}

export type GeminiRuntimeEnv = {
  apiKey: string;
  model: string;
};

export function getGeminiRuntimeEnv(
  env: EnvSource = process.env,
): GeminiRuntimeEnv | null {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
  };
}

export function getTurnstileSecret(env: EnvSource = process.env): string | undefined {
  const value = env.TURNSTILE_SECRET_KEY?.trim();
  return value ? value : undefined;
}

export function getRateLimitSecret(env: EnvSource = process.env): string | undefined {
  const value = env.RATE_LIMIT_SECRET?.trim();
  return value ? value : undefined;
}
