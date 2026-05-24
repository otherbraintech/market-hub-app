const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Manually parse .env for DATABASE_URL
const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL="?([^"\n]+)"?/);
const databaseUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!databaseUrl) {
  console.error('No DATABASE_URL found in .env!');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('--- BUSINESESS ---');
    const businesses = await prisma.business.findMany({
      select: { id: true, name: true, competitorGeneralReport: true }
    });
    console.log(JSON.stringify(businesses, null, 2));

    console.log('\n--- COMPETITORS ---');
    const competitors = await prisma.competitor.findMany({
      select: { id: true, name: true, businessId: true }
    });
    console.log(JSON.stringify(competitors, null, 2));

    console.log('\n--- COMPLETED ANALYSIS REPORTS ---');
    const reports = await prisma.analysisReport.findMany({
      where: { status: 'COMPLETED' },
      select: { id: true, type: true, entityId: true, channel: true, status: true, completedAt: true }
    });
    console.log(JSON.stringify(reports, null, 2));
  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
