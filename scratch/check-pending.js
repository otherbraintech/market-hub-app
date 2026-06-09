const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pendingReports = await prisma.analysisReport.findMany({
    where: {
      status: {
        in: ['PENDING', 'PROCESSING']
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log('--- REPORTES PENDIENTES O EN PROCESO ---');
  console.log(JSON.stringify(pendingReports, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
