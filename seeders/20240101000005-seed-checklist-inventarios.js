'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('checklist_inventarios', [
      {
        nombre: 'Checklist Estándar',
        descripcion: 'Checklist básico para verificación de cabaña',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('checklist_inventarios', null, {});
  }
};
