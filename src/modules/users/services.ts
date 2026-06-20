import { prisma } from '@/lib/prisma'

export async function listUsers() {
  const users = await prisma.user.findMany({
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

  // Obtener conteo de competidores por usuario
  const usersWithCompetitors = await Promise.all(
    users.map(async (user) => {
      const competitorCount = await prisma.competitor.count({
        where: {
          business: {
            userId: user.id
          }
        }
      })
      return {
        ...user,
        _count: {
          ...user._count,
          competitors: competitorCount
        }
      }
    })
  )

  return usersWithCompetitors
}

export async function updateUserLimit(userId: string, maxBusinesses: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { maxBusinesses }
  })
}
