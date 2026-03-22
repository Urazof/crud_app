import { buildApp } from "./app";
import { env } from "./config/env";

async function start(): Promise<void> {
  const app = buildApp();
  app.setNotFoundHandler(async (_request, reply) => {
    return reply.status(404).send({
      statusCode: 404,
      error: "Not Found",
      message: "Route not found",
    });
  });
  app.setErrorHandler(async (error, _request, reply) => {
    app.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Something went wrong on the server",
    });
  });
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}
void start();