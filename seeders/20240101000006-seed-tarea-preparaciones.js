'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('tarea_preparaciones', [
      {
        nombre: 'Limpiar cabaña',
        descripcion: 'Limpiar todas las habitaciones y áreas comunes',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Verificar inventario',
        descripcion: 'Revisar que todos los elementos estén presentes',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Verificar servicios',
        descripcion: 'Revisar que agua, luz y gas funcionen correctamente',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Preparar ropa de cama',
        descripcion: 'Colocar ropa de cama limpia en todas las camas',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tarea_preparaciones', null, {});
  }
};
