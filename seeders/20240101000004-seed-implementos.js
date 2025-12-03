'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar si ya existen implementos para evitar duplicados
    const existingImplementos = await queryInterface.sequelize.query(
      "SELECT nombre FROM implementos WHERE nombre IN ('Parrilla Portátil', 'Mesa Plegable', 'Sillas de Playa')",
      { type: Sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    const existingNames = existingImplementos.map(i => i.nombre);

    const implementosToInsert = [
      {
        nombre: 'Parrilla Portátil',
        descripcion: 'Parrilla de carbón portátil',
        stockTotal: 5,
        stockDisponible: 5,
        precioPrestamo: 2000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Mesa Plegable',
        descripcion: 'Mesa plegable para exterior',
        stockTotal: 10,
        stockDisponible: 10,
        precioPrestamo: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Sillas de Playa',
        descripcion: 'Sillas reclinables para playa',
        stockTotal: 15,
        stockDisponible: 15,
        precioPrestamo: 500,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ].filter(implemento => !existingNames.includes(implemento.nombre));

    if (implementosToInsert.length > 0) {
      await queryInterface.bulkInsert('implementos', implementosToInsert);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('implementos', {
      nombre: {
        [Sequelize.Op.in]: ['Parrilla Portátil', 'Mesa Plegable', 'Sillas de Playa']
      }
    }, {});
  }
};
