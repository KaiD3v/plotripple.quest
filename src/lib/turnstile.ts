import { AppError } from "@/lib/errors";
import {
  getTurnstileSecret,
  isProductionRuntime,
} from "@/lib/env";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileIfConfigured(
  token: string | undefined,
): Promise<void> {
  const secret = getTurnstileSecret();

  if (!secret) {
    if (isProductionRuntime()) {
      console.error("turnstile_unconfigured");
      throw new AppError("BOT_VERIFICATION_FAILED", 403);
    }
    console.warn(
      "Turnstile skipped in development because TURNSTILE_SECRET_KEY is not set.",
    );
    return;
  }

  if (!token) {
    throw new AppError("BOT_VERIFICATION_FAILED", 403);
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  let payload: { success?: unknown };
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });
    payload = (await response.json()) as { success?: unknown };
  } catch {
    throw new AppError("BOT_VERIFICATION_FAILED", 403);
  }

  if (payload.success !== true) {
    throw new AppError("BOT_VERIFICATION_FAILED", 403);
  }
}
