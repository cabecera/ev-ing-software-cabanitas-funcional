'use strict';

/**
 * Migración: Eliminar estado "reservada" del ENUM de cabañas
 *
 * Razón: El estado "reservada" no tiene sentido porque una cabaña puede estar
 * reservada en ciertas fechas pero disponible en otras. La disponibilidad debe
 * calcularse dinámicamente según las reservas activas.
 *
 * Cambios:
 * - Cambiar ENUM de ('disponible', 'reservada', 'mantenimiento') a ('disponible', 'mantenimiento')
 * - Actualizar todas las cabañas con estado "reservada" a "disponible"
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero, actualizar todas las cabañas con estado "reservada" a "disponible"
    await queryInterface.sequelize.query(
      "UPDATE cabanas SET estado = 'disponible' WHERE estado = 'reservada'"
    );

    // Modificar el ENUM para eliminar 'reservada'
    // En MySQL, necesitamos recrear el ENUM
    await queryInterface.sequelize.query(`
      ALTER TABLE cabanas
      MODIFY COLUMN estado ENUM('disponible', 'mantenimiento')
      NOT NULL DEFAULT 'disponible'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revertir: restaurar el ENUM original con 'reservada'
    await queryInterface.sequelize.query(`
      ALTER TABLE cabanas
      MODIFY COLUMN estado ENUM('disponible', 'reservada', 'mantenimiento')
      NOT NULL DEFAULT 'disponible'
    `);
  }
};


