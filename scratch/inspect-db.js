const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgres://postgres:mb8sa54mddpxo0ja23tx@76.13.228.134:5435/markethub?sslmode=disable";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  
  try {
    const res = await client.query(`
      SELECT id, type, "entityId", url, channel, status, "createdAt"
      FROM "AnalysisReport"
      WHERE status IN ('PENDING', 'PROCESSING')
      ORDER BY "createdAt" DESC;
    `);
    
    console.log('--- REPORTES PENDIENTES O EN PROCESO ---');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
