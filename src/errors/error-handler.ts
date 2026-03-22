import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError, badRequest } from "./app-error";

function normalizeZodMessage(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.status(404).send({
      statusCode: 404,
      error: "Not Found",
      message: "Route not found",
    });
  });

  app.setErrorHandler(async (error, _request, reply) => {
    if (error instanceof ZodError) {
      const normalized = badRequest(normalizeZodMessage(error));
      return reply.status(normalized.statusCode).send({
        statusCode: normalized.statusCode,
        error: "Bad Request",
        message: normalized.message,
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.statusCode === 404 ? "Not Found" : "Bad Request",
        message: error.message,
      });
    }

    app.log.error(error);

    return reply.status(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Something went wrong on the server",
    });
  });
}

