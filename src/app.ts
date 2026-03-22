import Fastify, { type FastifyInstance } from "fastify";
export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });
  app.get("/api/health", async () => {
    return {
      status: "ok",
      service: "crud_app",
    };
  });
  return app;
}