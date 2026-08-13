import type { ApiErrorCode } from "@/types/generator";

const publicMessages: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: "The request could not be validated.",
  BOT_VERIFICATION_FAILED: "Verification failed. Please try again.",
  RATE_LIMITED: "Too many requests. Please try again later.",
  AI_UNAVAILABLE: "The generator is temporarily unavailable.",
  INVALID_AI_RESPONSE: "The generator returned an unusable result.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

export type AppErrorOptions = {
  message?: string;
  step?: string;
  providerStatus?: number;
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly step?: string;
  readonly providerStatus?: number;

  constructor(
    code: ApiErrorCode,
    status: number,
    options?: string | AppErrorOptions,
  ) {
    const opts = typeof options === "string" ? { message: options } : options;
    super(opts?.message ?? publicMessages[code]);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.step = opts?.step;
    this.providerStatus = opts?.providerStatus;
  }
}

export function publicErrorBody(error: AppError): {
  error: { code: ApiErrorCode; message: string };
} {
  return {
    error: {
      code: error.code,
      message: publicMessages[error.code],
    },
  };
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const status = readStatus(error);

  if (isTimeoutError(error)) {
    return new AppError("AI_UNAVAILABLE", 504, {
      step: "timeout",
      providerStatus: status,
    });
  }

  if (status === 429 || isRateLimitError(error)) {
    return new AppError("RATE_LIMITED", 429, {
      step: "provider_rate_limit",
      providerStatus: status ?? 429,
    });
  }

  if (status === 400) {
    return new AppError("AI_UNAVAILABLE", 502, {
      step: "provider_request",
      providerStatus: status,
    });
  }

  if (status === 401 || status === 403 || status === 404) {
    return new AppError("AI_UNAVAILABLE", 503, {
      step: "provider_unavailable",
      providerStatus: status,
    });
  }

  if (status && status >= 500) {
    return new AppError("AI_UNAVAILABLE", 503, {
      step: "provider_unavailable",
      providerStatus: status,
    });
  }

  return new AppError("INTERNAL_ERROR", 500, {
    step: "unexpected",
    providerStatus: status,
  });
}

export function readStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    httpStatus?: unknown;
    code?: unknown;
  };

  for (const value of [
    candidate.status,
    candidate.statusCode,
    candidate.httpStatus,
    candidate.code,
  ]) {
    if (typeof value === "number" && Number.isInteger(value)) {
      return value;
    }
  }

  if (typeof candidate.status === "string") {
    const parsed = Number.parseInt(candidate.status, 10);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { name?: unknown; code?: unknown; message?: unknown };
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return (
    candidate.name === "AbortError" ||
    candidate.name === "TimeoutError" ||
    candidate.code === "ETIMEDOUT" ||
    candidate.code === "ABORT_ERR" ||
    /timeout|timed out|aborted/i.test(message)
  );
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { message?: unknown; status?: unknown };
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return /resource.?exhausted|quota|rate.?limit/i.test(message);
}

export function logOperationalError(
  label: string,
  details: {
    code?: string;
    step?: string;
    status?: number;
    model?: string;
    durationMs?: number;
  },
): void {
  console.error(label, {
    code: details.code,
    step: details.step,
    status: details.status,
    model: details.model,
    durationMs: details.durationMs,
  });
}
