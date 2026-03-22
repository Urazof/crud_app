import type { Product } from "../modules/products/products.types";

export type IpcAction = "GET_ALL" | "GET_BY_ID" | "CREATE" | "UPDATE" | "DELETE";

export interface IpcRequest {
  kind: "products:request";
  requestId: string;
  action: IpcAction;
  payload?: {
    id?: string;
    product?: Product;
  };
}

export interface IpcResponse {
  kind: "products:response";
  requestId: string;
  ok: boolean;
  result?: {
    product?: Product | null;
    products?: Product[];
    deleted?: boolean;
  };
  error?: {
    statusCode: number;
    message: string;
  };
}

export function isIpcResponse(value: unknown): value is IpcResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (value as IpcResponse).kind === "products:response";
}

export function isIpcRequest(value: unknown): value is IpcRequest {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (value as IpcRequest).kind === "products:request";
}

