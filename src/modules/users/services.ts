import { prisma } from '@/lib/prisma'

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      maxBusinesses: true,
      maxCompetitors: true,
      createdAt: true,
      _count: {
        select: { businesses: true }
      }
    }
  })
}

export async function updateUserLimit(userId: string, maxBusinesses: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { maxBusinesses }
  })
}
