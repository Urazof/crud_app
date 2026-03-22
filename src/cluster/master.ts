import cluster, { type Worker } from "cluster";
import { availableParallelism } from "os";
import { env } from "../config/env";
import { createLoadBalancer } from "./load-balancer";
import type { IpcRequest, IpcResponse } from "./ipc-protocol";
import { isIpcRequest } from "./ipc-protocol";
import { inMemoryStore } from "../modules/products/in-memory.store";
import { startWorker } from "./worker";

function toResponse(requestId: string, partial: Omit<IpcResponse, "kind" | "requestId">): IpcResponse {
  return {
    kind: "products:response",
    requestId,
    ...partial,
  };
}

function handleRequest(message: IpcRequest): IpcResponse {
  const { requestId, action, payload } = message;

  switch (action) {
    case "GET_ALL": {
      return toResponse(requestId, {
        ok: true,
        result: { products: inMemoryStore.getAll() },
      });
    }
    case "GET_BY_ID": {
      if (!payload?.id) {
        return toResponse(requestId, {
          ok: false,
          error: { statusCode: 400, message: "Missing id" },
        });
      }

      return toResponse(requestId, {
        ok: true,
        result: { product: inMemoryStore.getById(payload.id) },
      });
    }
    case "CREATE": {
      if (!payload?.product) {
        return toResponse(requestId, {
          ok: false,
          error: { statusCode: 400, message: "Missing product" },
        });
      }

      return toResponse(requestId, {
        ok: true,
        result: { product: inMemoryStore.create(payload.product) },
      });
    }
    case "UPDATE": {
      if (!payload?.id || !payload.product) {
        return toResponse(requestId, {
          ok: false,
          error: { statusCode: 400, message: "Missing id or product" },
        });
      }

      return toResponse(requestId, {
        ok: true,
        result: { product: inMemoryStore.update(payload.id, payload.product) },
      });
    }
    case "DELETE": {
      if (!payload?.id) {
        return toResponse(requestId, {
          ok: false,
          error: { statusCode: 400, message: "Missing id" },
        });
      }

      return toResponse(requestId, {
        ok: true,
        result: { deleted: inMemoryStore.delete(payload.id) },
      });
    }
    default:
      return toResponse(requestId, {
        ok: false,
        error: { statusCode: 400, message: "Unknown action" },
      });
  }
}

function resolveWorkerCount(): number {
  const computed = Math.max(1, availableParallelism() - 1);
  return env.WORKERS ?? computed;
}

function setupWorker(worker: Worker, workerPort: number): void {
  worker.on("message", (message: unknown) => {
    if (!isIpcRequest(message)) {
      return;
    }

    const response = handleRequest(message);
    worker.send(response);
  });

  worker.on("online", () => {
    // Keep startup logs simple for educational clarity.
    console.log(`[cluster] worker ${worker.id} online on port ${workerPort}`);
  });
}

async function startMaster(): Promise<void> {
  const workersCount = resolveWorkerCount();
  const workerPorts: number[] = [];
  const workerPortById = new Map<number, number>();

  for (let i = 1; i <= workersCount; i += 1) {
    const workerPort = env.PORT + i;
    workerPorts.push(workerPort);

    const worker = cluster.fork({
      WORKER_PORT: String(workerPort),
    });

    workerPortById.set(worker.id, workerPort);
    setupWorker(worker, workerPort);
  }

  cluster.on("exit", (worker, _code, _signal) => {
    const crashedPort = workerPortById.get(worker.id);

    if (!crashedPort) {
      return;
    }

    const replacement = cluster.fork({
      WORKER_PORT: String(crashedPort),
    });

    workerPortById.set(replacement.id, crashedPort);
    setupWorker(replacement, crashedPort);
  });

  const loadBalancer = createLoadBalancer({
    host: env.HOST,
    listenPort: env.PORT,
    workerPorts,
  });

  await new Promise<void>((resolve, reject) => {
    loadBalancer.once("error", reject);
    loadBalancer.listen(env.PORT, env.HOST, () => {
      console.log(`[cluster] load balancer listening on http://${env.HOST}:${env.PORT}`);
      resolve();
    });
  });
}

if (cluster.isPrimary) {
  void startMaster().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  void startWorker();
}
