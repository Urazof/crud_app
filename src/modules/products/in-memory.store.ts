import type { Product } from "./products.types";

const products = new Map<string, Product>();

export const inMemoryStore = {
  getAll(): Product[] {
    return Array.from(products.values());
  },
  getById(id: string): Product | null {
    return products.get(id) ?? null;
  },
  create(product: Product): Product {
    products.set(product.id, product);
    return product;
  },
  update(id: string, product: Product): Product {
    products.set(id, product);
    return product;
  },
  delete(id: string): boolean {
    return products.delete(id);
  },
  clear(): void {
    products.clear();
  },
};

