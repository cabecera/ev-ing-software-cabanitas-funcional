/**
 * Configuración de Base de Datos
 *
 * Define las configuraciones de conexión para diferentes entornos (development, production).
 * Las credenciales se obtienen de variables de entorno para mayor seguridad.
 *
 * @module config/database
 */

require('dotenv').config();

module.exports = {
  // Configuración para entorno de desarrollo
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cabanitas_dev',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql', // Motor de base de datos MySQL
    logging: false // Desactivar logs de SQL en desarrollo (cambiar a console.log para debug)
  },
  // Configuración para entorno de producción
  production: {
    username: process.env.DB_USER, // Requerido en producción
    password: process.env.DB_PASS, // Requerido en producción
    database: process.env.DB_NAME, // Requerido en producción
    host: process.env.DB_HOST, // Requerido en producción
    dialect: 'mysql',
    logging: false // Desactivar logs en producción por seguridad y rendimiento
  }
};
