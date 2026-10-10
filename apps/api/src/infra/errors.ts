import type { FastifyReply } from "fastify";

/**
 * Typed AppError hierarchy for consistent JSON error responses.
 * Every error maps to { code, message, retryable }.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly retryable: boolean;

  constructor(code: string, message: string, statusCode: number, retryable = false) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }

  toJSON() {
    return { code: this.code, message: this.message, retryable: this.retryable };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super("AUTH_ERROR", message, 401);
    this.name = "AuthError";
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("RATE_LIMITED", "Too many requests. Please wait a moment.", 429, true);
    this.name = "RateLimitError";
  }
}

export class AIProviderError extends AppError {
  constructor(provider: string, detail: string) {
    super(
      "AI_PROVIDER_ERROR",
      `AI provider (${provider}) error: ${detail}`,
      502,
      true
    );
    this.name = "AIProviderError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

/**
 * Fastify error handler that maps AppError and ZodError into consistent JSON.
 */
export function errorHandler(
  error: Error,
  _request: unknown,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    void reply.status(error.statusCode).send(error.toJSON());
    return;
  }

  // Zod validation errors
  if (error.name === "ZodError") {
    void reply.status(400).send({
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      retryable: false,
    });
    return;
  }

  // Fastify content type parsing errors
  if ("statusCode" in error && typeof (error as Record<string, unknown>).statusCode === "number") {
    const statusCode = (error as Record<string, unknown>).statusCode as number;
    void reply.status(statusCode).send({
      code: "REQUEST_ERROR",
      message: error.message,
      retryable: false,
    });
    return;
  }

  // Unhandled errors
  console.error("Unhandled error:", error);
  void reply.status(500).send({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    retryable: true,
  });
}
