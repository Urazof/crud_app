import { inMemoryStore } from "./in-memory.store";
import type { Product } from "./products.types";

export class ProductsRepository {
  async getAll(): Promise<Product[]> {
    return inMemoryStore.getAll();
  }

  async getById(id: string): Promise<Product | null> {
    return inMemoryStore.getById(id);
  }

  async create(product: Product): Promise<Product> {
    return inMemoryStore.create(product);
  }

  async update(id: string, product: Product): Promise<Product> {
    return inMemoryStore.update(id, product);
  }

  async delete(id: string): Promise<boolean> {
    return inMemoryStore.delete(id);
  }
}

