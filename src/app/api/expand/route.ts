import { NextResponse } from "next/server";
import { AppError, logOperationalError, publicErrorBody, toAppError } from "@/lib/errors";
import { generateFollowUps } from "@/lib/gemini/generate-follow-ups";
import { enforceRateLimit } from "@/lib/rate-limit";
import { expandRippleRequestSchema } from "@/schemas/follow-up";

const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();

  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      throw new AppError("VALIDATION_ERROR", 400, { step: "payload" });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      throw new AppError("VALIDATION_ERROR", 400, { step: "payload" });
    }

    const parsed = expandRippleRequestSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", 400, { step: "payload" });
    }

    await enforceRateLimit(request);

    const result = await generateFollowUps(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    const appError = error instanceof AppError ? error : toAppError(error);
    if (!(error instanceof AppError) || appError.code === "INTERNAL_ERROR") {
      logOperationalError("expand_unhandled", {
        code: appError.code,
        step: appError.step ?? "unexpected",
        status: appError.status,
        durationMs: Date.now() - startedAt,
      });
    }
    return NextResponse.json(publicErrorBody(appError), {
      status: appError.status,
    });
  }
}
