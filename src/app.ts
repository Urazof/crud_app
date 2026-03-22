import Fastify, { type FastifyInstance } from "fastify";
import { registerProductsRoutes } from "./modules/products/products.routes";
import type { ProductsService } from "./modules/products/products.service";

interface BuildAppOptions {
  productsService?: ProductsService;
  instanceLabel?: string;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get("/api/health", async () => {
    return {
      status: "ok",
      service: "crud_app",
      instance: options.instanceLabel ?? "single",
      pid: process.pid,
    };
  });

  registerProductsRoutes(app, options.productsService);

  return app;
}