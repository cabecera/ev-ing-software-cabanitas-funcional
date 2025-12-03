'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener ID del usuario cliente específico
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'cliente@example.com'"
    );

    if (users.length > 0) {
      // Verificar si el cliente ya existe
      const [clienteExists] = await queryInterface.sequelize.query(
        `SELECT id FROM clientes WHERE userId = ${users[0].id}`
      );

      if (clienteExists.length === 0) {
        await queryInterface.bulkInsert('clientes', [
          {
            userId: users[0].id,
            nombre: 'Juan',
            apellido: 'Pérez',
            telefono: '123456789',
            direccion: 'Calle Falsa 123',
            dni: '12345678',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('clientes', {
      dni: '12345678'
    }, {});
  }
};
