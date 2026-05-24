const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

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
    const business = await prisma.business.findUnique({
      where: { id: 'cmp31dubn0000xklh3gwdxaiw' },
      select: { competitorGeneralReport: true }
    });
    
    if (!business || !business.competitorGeneralReport) {
      console.log('No competitorGeneralReport found.');
      return;
    }
    
    const report = typeof business.competitorGeneralReport === 'string'
      ? JSON.parse(business.competitorGeneralReport)
      : business.competitorGeneralReport;
      
    console.log('Report generatedAt:', report.generatedAt);
    console.log('Report keys:', Object.keys(report));
    console.log('Executive summary type:', typeof report.executiveSummary);
    console.log('Executive summary length:', report.executiveSummary ? report.executiveSummary.length : 0);
    if (report.executiveSummary) {
      console.log('Executive summary preview:', report.executiveSummary.substring(0, 300));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
