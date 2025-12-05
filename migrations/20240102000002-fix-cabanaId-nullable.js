'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Modificar cabanaId para permitir NULL usando SQL directo
    await queryInterface.sequelize.query(`
      ALTER TABLE mantenimientos
      MODIFY COLUMN cabanaId INT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revertir: hacer cabanaId NOT NULL (cuidado si hay datos NULL)
    await queryInterface.sequelize.query(`
      ALTER TABLE mantenimientos
      MODIFY COLUMN cabanaId INT NOT NULL;
    `);
  }
};




