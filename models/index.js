/**
 * Índice de Modelos - Sequelize ORM
 *
 * Este archivo carga automáticamente todos los modelos de Sequelize desde el directorio
 * y establece las relaciones entre ellos. Es el punto de entrada para acceder a los modelos.
 *
 * @module models
 */

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

// Crear instancia de Sequelize según la configuración
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Cargar automáticamente todos los modelos del directorio
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && // Ignorar archivos ocultos
      file !== basename && // Ignorar este archivo (index.js)
      file.slice(-3) === '.js' && // Solo archivos .js
      file.indexOf('.test.js') === -1 // Ignorar archivos de test
    );
  })
  .forEach(file => {
    // Cargar cada modelo y registrarlo en el objeto db
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Establecer relaciones entre modelos
// Cada modelo puede tener un método 'associate' que define sus relaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Exportar instancia de Sequelize y clase Sequelize para uso avanzado
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
