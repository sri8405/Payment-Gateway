export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

const statusByCode: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  DATABASE_ERROR: 500,
  INTERNAL_ERROR: 500
};

export class AppError extends Error {
  code: AppErrorCode;
  statusCode: number;

  constructor(code: AppErrorCode, message: string, statusCode = statusByCode[code]) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function toAppError(error: unknown, fallback = "Internal server error") {
  if (error instanceof AppError) {
    return error;
  }

  // Log full error stack and details on the server
  console.error("[ServerError]", error);

  return new AppError("INTERNAL_ERROR", fallback);
}

export function apiErrorResponse(error: unknown) {
  const appError = toAppError(error);
  return Response.json(
    {
      success: false,
      error: appError.message,
      code: appError.code,
    },
    { status: appError.statusCode }
  );
}
