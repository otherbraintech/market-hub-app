/**
 * Módulo Products - Tipos y Servicios
 */

import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { Product, Prisma } from '@prisma/client'

// Tipos
export interface ProductFeature {
  id: string
  name: string
  description: string
  icon?: string
}

export interface ProductBenefit {
  id: string
  title: string
  description: string
  forPersona?: string  // Opcional: para qué persona es más relevante
}

export interface ProductPricing {
  currency: string
  basePrice: number
  discountPrice?: number
  period?: 'monthly' | 'yearly' | 'one-time'
  plans?: {
    name: string
    price: number
    features: string[]
  }[]
}

export interface CreateProductInput {
  businessId: string
  name: string
  slug?: string
  description: string
  shortDesc?: string
  features: ProductFeature[]
  benefits: ProductBenefit[]
  pricing?: ProductPricing
  images?: string[]
  keywords?: string[]
  isActive?: boolean
}

export interface UpdateProductInput extends Partial<Omit<CreateProductInput, 'businessId'>> {}

export interface ProductWithTypes extends Omit<Product, 'features' | 'benefits' | 'pricing' | 'images' | 'keywords'> {
  features: ProductFeature[]
  benefits: ProductBenefit[]
  pricing: ProductPricing | null
  images: string[] | null
  keywords: string[] | null
}

// Servicios
export async function createProduct(input: CreateProductInput): Promise<ProductWithTypes> {
  const slug = input.slug || slugify(input.name)
  
  const existing = await prisma.product.findFirst({
    where: { businessId: input.businessId, slug }
  })
  
  if (existing) {
    throw new Error(`Ya existe un producto con el slug: ${slug}`)
  }

  const product = await prisma.product.create({
    data: {
      businessId: input.businessId,
      name: input.name,
      slug,
      description: input.description,
      shortDesc: input.shortDesc,
      features: input.features as unknown as Prisma.JsonArray,
      benefits: input.benefits as unknown as Prisma.JsonArray,
      pricing: input.pricing as Prisma.JsonObject | undefined,
      images: input.images as Prisma.JsonArray | undefined,
      keywords: input.keywords as Prisma.JsonArray | undefined,
      isActive: input.isActive ?? true,
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Product',
      entityId: product.id,
      action: 'CREATE',
      changes: { name: input.name },
    },
  })

  return product as unknown as ProductWithTypes
}

export async function getProductById(id: string): Promise<ProductWithTypes | null> {
  const product = await prisma.product.findUnique({ where: { id } })
  return product as unknown as ProductWithTypes | null
}

export async function listProductsByBusiness(
  businessId: string,
  options?: { activeOnly?: boolean; skip?: number; take?: number }
): Promise<{ products: ProductWithTypes[]; total: number }> {
  const { activeOnly = false, skip = 0, take = 20 } = options ?? {}
  
  const where: Prisma.ProductWhereInput = {
    businessId,
    ...(activeOnly && { isActive: true }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ])

  return { products: products as unknown as ProductWithTypes[], total }
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductWithTypes> {
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.shortDesc !== undefined && { shortDesc: input.shortDesc }),
      ...(input.features && { features: input.features as unknown as Prisma.JsonArray }),
      ...(input.benefits && { benefits: input.benefits as unknown as Prisma.JsonArray }),
      ...(input.pricing !== undefined && { pricing: input.pricing as unknown as Prisma.JsonObject | null }),
      ...(input.images !== undefined && { images: input.images as Prisma.JsonArray | null }),
      ...(input.keywords !== undefined && { keywords: input.keywords as Prisma.JsonArray | null }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    } as any,
  })

  return product as unknown as ProductWithTypes
}

export async function deleteProduct(id: string): Promise<void> {
  await prisma.product.delete({ where: { id } })
}

export async function getProductContextForAI(productId: string) {
  const product = await getProductById(productId)
  if (!product) throw new Error(`Producto no encontrado: ${productId}`)
  
  return {
    name: product.name,
    description: product.description,
    shortDesc: product.shortDesc,
    features: product.features.map(f => `${f.name}: ${f.description}`),
    benefits: product.benefits.map(b => b.title),
    keywords: product.keywords,
  }
}
