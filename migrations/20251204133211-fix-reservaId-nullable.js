'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Usar SQL directo para forzar que reservaId sea NULL
    // Esto es necesario porque changeColumn a veces no funciona correctamente en MySQL
    await queryInterface.sequelize.query(`
      ALTER TABLE pagos MODIFY COLUMN reservaId INTEGER NULL;
    `);

    console.log('✅ Columna reservaId ahora es NULLABLE');
  },

  async down (queryInterface, Sequelize) {
    // Revertir: hacer reservaId NOT NULL nuevamente
    // Primero necesitamos asegurarnos de que no haya valores NULL
    await queryInterface.sequelize.query(`
      UPDATE pagos SET reservaId = 0 WHERE reservaId IS NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE pagos MODIFY COLUMN reservaId INTEGER NOT NULL;
    `);
  }
};
