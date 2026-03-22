import { badRequest } from "../../errors/app-error";
import type { IpcAction, IpcRequest, IpcResponse } from "../../cluster/ipc-protocol";
import { isIpcResponse } from "../../cluster/ipc-protocol";
import type { Product } from "./products.types";
import type { ProductsRepositoryPort } from "./products.repository";

const DEFAULT_TIMEOUT_MS = 5000;

function nextRequestId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class IpcProductsRepository implements ProductsRepositoryPort {
  private readonly pending = new Map<string, {
    resolve: (response: IpcResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor() {
    process.on("message", (message) => {
      if (!isIpcResponse(message)) {
        return;
      }

      const pending = this.pending.get(message.requestId);

      if (!pending) {
        return;
      }

      clearTimeout(pending.timeout);
      this.pending.delete(message.requestId);
      pending.resolve(message);
    });
  }

  async getAll(): Promise<Product[]> {
    const response = await this.send("GET_ALL");

    if (!response.ok) {
      throw badRequest(response.error?.message ?? "IPC read error");
    }

    return response.result?.products ?? [];
  }

  async getById(id: string): Promise<Product | null> {
    const response = await this.send("GET_BY_ID", { id });

    if (!response.ok) {
      throw badRequest(response.error?.message ?? "IPC read error");
    }

    return response.result?.product ?? null;
  }

  async create(product: Product): Promise<Product> {
    const response = await this.send("CREATE", { product });

    if (!response.ok || !response.result?.product) {
      throw badRequest(response.error?.message ?? "IPC create error");
    }

    return response.result.product;
  }

  async update(id: string, product: Product): Promise<Product> {
    const response = await this.send("UPDATE", { id, product });

    if (!response.ok || !response.result?.product) {
      throw badRequest(response.error?.message ?? "IPC update error");
    }

    return response.result.product;
  }

  async delete(id: string): Promise<boolean> {
    const response = await this.send("DELETE", { id });

    if (!response.ok) {
      throw badRequest(response.error?.message ?? "IPC delete error");
    }

    return response.result?.deleted ?? false;
  }

  private async send(action: IpcAction, payload?: IpcRequest["payload"]): Promise<IpcResponse> {
    if (typeof process.send !== "function") {
      throw new Error("IPC channel is not available");
    }

    const requestId = nextRequestId();
    const message: IpcRequest = {
      kind: "products:request",
      requestId,
      action,
      payload,
    };

    const response = await new Promise<IpcResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`IPC timeout for action '${action}'`));
      }, DEFAULT_TIMEOUT_MS);

      this.pending.set(requestId, { resolve, reject, timeout });

      process.send?.(message, (error) => {
        if (!error) {
          return;
        }

        clearTimeout(timeout);
        this.pending.delete(requestId);
        reject(error);
      });
    });

    return response;
  }
}

