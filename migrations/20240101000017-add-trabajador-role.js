'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Modificar el ENUM para incluir 'trabajador'
    await queryInterface.sequelize.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'encargado', 'cliente', 'trabajador') NOT NULL DEFAULT 'cliente'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revertir al ENUM original
    await queryInterface.sequelize.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'encargado', 'cliente') NOT NULL DEFAULT 'cliente'
    `);
  }
};
