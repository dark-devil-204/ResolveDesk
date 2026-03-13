import { NextResponse } from "next/server";
import { ApiError } from "./api-error";
import { ZodError } from "zod";

export function handleApiError(error: unknown) {
  if (error instanceof Response) {
    return NextResponse.json(
      { error: error.statusText || "Request failed" },
      { status: error.status },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.flatten(),
      },
      { status: 400 },
    );
  }

  console.error("Unexpected API error:", error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

export function apiHandler(
  handler: (req: Request, context?: any) => Promise<Response>,
) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
