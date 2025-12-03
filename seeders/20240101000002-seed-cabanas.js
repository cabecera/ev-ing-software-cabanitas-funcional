'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar si ya existen cabañas para evitar duplicados
    const existingCabanas = await queryInterface.sequelize.query(
      "SELECT nombre FROM cabanas WHERE nombre IN ('Cabaña del Lago', 'Cabaña del Bosque')",
      { type: Sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    const existingNames = existingCabanas.map(c => c.nombre);

    const cabanasToInsert = [
      {
        nombre: 'Cabaña del Lago',
        capacidad: 4,
        estado: 'disponible',
        precioNoche: 15000,
        descripcion: 'Hermosa cabaña frente al lago con vista panorámica. Incluye cocina completa, parrilla y terraza.',
        fotos: JSON.stringify(['/images/cabana1.jpg']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Cabaña del Bosque',
        capacidad: 6,
        estado: 'disponible',
        precioNoche: 18000,
        descripcion: 'Cabaña acogedora en el bosque, ideal para familias grandes. Incluye jacuzzi y chimenea.',
        fotos: JSON.stringify(['/images/cabana2.jpg']),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ].filter(cabana => !existingNames.includes(cabana.nombre));

    if (cabanasToInsert.length > 0) {
      await queryInterface.bulkInsert('cabanas', cabanasToInsert);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('cabanas', {
      nombre: {
        [Sequelize.Op.in]: ['Cabaña del Lago', 'Cabaña del Bosque']
      }
    }, {});
  }
};
