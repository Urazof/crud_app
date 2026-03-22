import { buildApp } from "../app";
import { env } from "../config/env";
import { registerErrorHandlers } from "../errors/error-handler";
import { IpcProductsRepository } from "../modules/products/ipc-products.repository";
import { ProductsService } from "../modules/products/products.service";

function getWorkerPort(): number {
  const raw = process.env.WORKER_PORT;

  if (!raw) {
    throw new Error("WORKER_PORT is required for cluster worker");
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("WORKER_PORT must be a valid port number");
  }

  return parsed;
}

export async function startWorker(): Promise<void> {
  const workerPort = getWorkerPort();
  const repository = new IpcProductsRepository();
  const service = new ProductsService(repository);
  const app = buildApp({
    productsService: service,
    instanceLabel: `worker-${workerPort}`,
  });

  registerErrorHandlers(app);

  try {
    await app.listen({
      port: workerPort,
      host: env.HOST,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

// Worker startup is controlled by the cluster master.
