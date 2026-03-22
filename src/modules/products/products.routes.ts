import type { FastifyInstance } from "fastify";
import { badRequest } from "../../errors/app-error";
import { productBodySchema, productIdParamSchema } from "./products.schemas";
import { InMemoryProductsRepository } from "./products.repository";
import { ProductsService } from "./products.service";
import type { ProductInput } from "./products.types";

export function registerProductsRoutes(
  app: FastifyInstance,
  service: ProductsService = new ProductsService(new InMemoryProductsRepository()),
): void {
  app.get("/api/products", async (_request, reply) => {
    const products = await service.getAll();
    return reply.status(200).send(products);
  });

  app.get("/api/products/:productId", async (request, reply) => {
    const parsed = productIdParamSchema.safeParse(request.params);

    if (!parsed.success) {
      throw badRequest(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const product = await service.getById(parsed.data.productId);
    return reply.status(200).send(product);
  });

  app.post("/api/products", async (request, reply) => {
    const parsed = productBodySchema.safeParse(request.body);

    if (!parsed.success) {
      throw badRequest(parsed.error.issues.map((i) => i.message).join("; "));
    }

    const product = await service.create(parsed.data as ProductInput);
    return reply.status(201).send(product);
  });

  app.put("/api/products/:productId", async (request, reply) => {
    const parsedParams = productIdParamSchema.safeParse(request.params);
    const parsedBody = productBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      throw badRequest(parsedParams.error.issues.map((i) => i.message).join("; "));
    }

    if (!parsedBody.success) {
      throw badRequest(parsedBody.error.issues.map((i) => i.message).join("; "));
    }

    const updated = await service.update(
      parsedParams.data.productId,
      parsedBody.data as ProductInput,
    );

    return reply.status(200).send(updated);
  });

  app.delete("/api/products/:productId", async (request, reply) => {
    const parsed = productIdParamSchema.safeParse(request.params);

    if (!parsed.success) {
      throw badRequest(parsed.error.issues.map((i) => i.message).join("; "));
    }

    await service.delete(parsed.data.productId);
    return reply.status(204).send();
  });
}
