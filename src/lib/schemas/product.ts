import { z } from "zod";

export const productFeatureSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  icon: z.string().optional()
});

export const productBenefitSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  forPersona: z.string().optional()
});

export const productPricingSchema = z.object({
  currency: z.string().default("USD"),
  basePrice: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  discountPrice: z.coerce.number().optional(),
  period: z.enum(["monthly", "yearly", "one-time"]).optional()
});

export const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  shortDesc: z.string().optional(),
  features: z.array(productFeatureSchema).default([]),
  benefits: z.array(productBenefitSchema).default([]),
  pricing: productPricingSchema.optional(),
  keywords: z.string().optional(), // Recibiremos un string separado por comas y lo convertiremos a array
  isActive: z.boolean().default(true)
});

export type ProductFormValues = z.infer<typeof productSchema>;
