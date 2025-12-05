// Script para corregir la columna reservaId en la tabla pagos
// Ejecutar: node scripts/fix-reservaId-nullable.js

const db = require('../models');

async function fixReservaId() {
  try {
    console.log('Corrigiendo columna reservaId para permitir NULL...');

    // Ejecutar ALTER TABLE directamente
    await db.sequelize.query(`
      ALTER TABLE pagos
      MODIFY COLUMN reservaId INT NULL DEFAULT NULL;
    `);

    console.log('Columna reservaId corregida exitosamente.');

    // Verificar la estructura
    const [results] = await db.sequelize.query(`DESCRIBE pagos`);
    const reservaIdColumn = results.find(col => col.Field === 'reservaId');

    if (reservaIdColumn) {
      console.log('Estructura actual de reservaId:');
      console.log(`  - Type: ${reservaIdColumn.Type}`);
      console.log(`  - Null: ${reservaIdColumn.Null}`);
      console.log(`  - Default: ${reservaIdColumn.Default}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error al corregir columna:', error.message);
    process.exit(1);
  }
}

fixReservaId();




