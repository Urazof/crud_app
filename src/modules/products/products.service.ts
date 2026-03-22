import { randomUUID } from "crypto";
import { notFound } from "../../errors/app-error";
import type { ProductsRepositoryPort } from "./products.repository";
import type { Product, ProductInput } from "./products.types";

export class ProductsService {
  constructor(private readonly repository: ProductsRepositoryPort) {}

  async getAll(): Promise<Product[]> {
    return this.repository.getAll();
  }

  async getById(id: string): Promise<Product> {
    const product = await this.repository.getById(id);

    if (!product) {
      throw notFound(`Product with id '${id}' was not found`);
    }

    return product;
  }

  async create(input: ProductInput): Promise<Product> {
    const product: Product = {
      id: randomUUID(),
      ...input,
    };

    return this.repository.create(product);
  }

  async update(id: string, input: ProductInput): Promise<Product> {
    const existing = await this.repository.getById(id);

    if (!existing) {
      throw notFound(`Product with id '${id}' was not found`);
    }

    const updated: Product = {
      id,
      ...input,
    };

    return this.repository.update(id, updated);
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw notFound(`Product with id '${id}' was not found`);
    }
  }
}
