import { buildApp } from "./app";
import { env } from "./config/env";
import { registerErrorHandlers } from "./errors/error-handler";

async function start(): Promise<void> {
  const app = buildApp();

  registerErrorHandlers(app);

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}
void start();