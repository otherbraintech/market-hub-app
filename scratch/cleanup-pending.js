const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgres://postgres:mb8sa54mddpxo0ja23tx@76.13.228.134:5435/markethub?sslmode=disable";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  
  try {
    // Actualizar reportes que tengan más de 1 hora de antigüedad y sigan en PENDING o PROCESSING a ERROR
    const res = await client.query(`
      UPDATE "AnalysisReport"
      SET status = 'ERROR', error = 'Análisis expirado o interrumpido (Timeout)'
      WHERE status IN ('PENDING', 'PROCESSING')
        AND "createdAt" < NOW() - INTERVAL '1 hour';
    `);
    
    console.log(`--- LIMPIEZA COMPLETADA ---`);
    console.log(`Reportes desbloqueados/actualizados a ERROR: ${res.rowCount}`);
  } catch (err) {
    console.error('Error al ejecutar la limpieza:', err);
  } finally {
    await client.end();
  }
}

main();
