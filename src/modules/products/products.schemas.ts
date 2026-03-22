import { z } from "zod";

export const productIdParamSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
});

export const productBodySchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().min(1, "description is required"),
  price: z
    .number("price must be a number")
    .positive("price must be greater than 0"),
  category: z.string().min(1, "category is required"),
  inStock: z.boolean("inStock must be a boolean"),
});
