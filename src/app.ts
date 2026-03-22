import Fastify, { type FastifyInstance } from "fastify";
import { registerProductsRoutes } from "./modules/products/products.routes";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get("/api/health", async () => {
    return {
      status: "ok",
      service: "crud_app",
    };
  });

  registerProductsRoutes(app);

  return app;
}