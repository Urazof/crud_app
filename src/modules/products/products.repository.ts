import { inMemoryStore } from "./in-memory.store";
import type { Product } from "./products.types";

export interface ProductsRepositoryPort {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(id: string, product: Product): Promise<Product>;
  delete(id: string): Promise<boolean>;
}

export class InMemoryProductsRepository implements ProductsRepositoryPort {
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
