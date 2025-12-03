'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Modificar ENUM para agregar 'trabajador'
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY role ENUM('admin', 'encargado', 'cliente', 'trabajador') NOT NULL DEFAULT 'cliente'"
    );
  },

  async down(queryInterface, Sequelize) {
    // Revertir al ENUM original
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY role ENUM('admin', 'encargado', 'cliente') NOT NULL DEFAULT 'cliente'"
    );
  }
};
