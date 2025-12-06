/**
 * Script para resetear la base de datos al estado inicial
 * Elimina todos los datos y vuelve a ejecutar los seeders
 */

require('dotenv').config();
const db = require('../models');

// Orden de eliminación respetando las foreign keys
const TABLES_TO_TRUNCATE = [
  'observaciones_clientes',
  'notificaciones',
  'incidentes',
  'encuesta_satisfaccions',
  'tarea_trabajadores',
  'preparacion_cabanas',
  'tarea_preparaciones',
  'entrega_cabanas',
  'item_verificacions',
  'checklist_inventarios',
  'prestamo_implementos',
  'pagos',
  'mantenimientos',
  'reporte_faltantes',
  'reservas',
  'clientes',
  'users',
  // No eliminamos cabañas e implementos porque vienen de seeders
  // 'implementos',
  // 'cabanas'
];

async function resetDatabase() {
  try {
    console.log('Iniciando reseteo de la base de datos...\n');

    // Verificar conexión
    await db.sequelize.authenticate();
    console.log('Conexion a la base de datos establecida.\n');

    // Desactivar verificaciones de foreign keys temporalmente
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Eliminar datos de todas las tablas
    console.log('Eliminando datos existentes...\n');

    for (const tableName of TABLES_TO_TRUNCATE) {
      try {
        // Verificar si la tabla existe
        const [results] = await db.sequelize.query(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?`,
          { replacements: [tableName] }
        );

        if (results && results[0] && results[0].count > 0) {
          await db.sequelize.query(`TRUNCATE TABLE \`${tableName}\``);
          console.log(`  [OK] Eliminados datos de: ${tableName}`);
        } else {
          console.log(`  [SKIP] Tabla no existe: ${tableName} (se omite)`);
        }
      } catch (error) {
        // Intentar eliminar de todas formas (puede que la tabla exista pero la query de verificación falle)
        try {
          await db.sequelize.query(`TRUNCATE TABLE \`${tableName}\``);
          console.log(`  [OK] Eliminados datos de: ${tableName}`);
        } catch (truncateError) {
          if (truncateError.message.includes("doesn't exist")) {
            console.log(`  [SKIP] Tabla no existe: ${tableName} (se omite)`);
          } else {
            console.log(`  [ERROR] Error al eliminar ${tableName}: ${truncateError.message}`);
          }
        }
      }
    }

    // Restaurar verificaciones de foreign keys
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\nDatos eliminados exitosamente.\n');
    console.log('Ejecutando seeders para restaurar datos iniciales...\n');

    // Cerrar conexión antes de ejecutar seeders
    await db.sequelize.close();

    // Ejecutar seeders usando el CLI de Sequelize
    const { execSync } = require('child_process');

    try {
      execSync('npx sequelize-cli db:seed:all', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('\nSeeders ejecutados exitosamente.\n');
    } catch (error) {
      console.error('\nError al ejecutar seeders. Ejecuta manualmente:');
      console.error('   npm run seed\n');
    }

    console.log('Reseteo completado. La base de datos esta en su estado inicial.\n');
    console.log('Credenciales por defecto:');
    console.log('   Admin: admin@cabanitas.com / admin123');
    console.log('   Encargado: encargado@cabanitas.com / encargado123');
    console.log('   Cliente: cliente@example.com / cliente123\n');

  } catch (error) {
    console.error('\nError durante el reseteo:', error.message);
    console.error(error);

    // Intentar restaurar foreign key checks
    try {
      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      // Ignorar error
    }

    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };

