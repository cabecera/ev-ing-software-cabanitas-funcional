'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar si el admin ya existe
    const [adminExists] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@cabanitas.com'"
    );

    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await queryInterface.bulkInsert('users', [
        {
          email: 'admin@cabanitas.com',
          password: hashedPassword,
          role: 'admin',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }

    // Verificar si el cliente ya existe
    const [clienteExists] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'cliente@example.com'"
    );

    if (clienteExists.length === 0) {
      const clientePassword = await bcrypt.hash('cliente123', 10);
      await queryInterface.bulkInsert('users', [
        {
          email: 'cliente@example.com',
          password: clientePassword,
          role: 'cliente',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }

    // Verificar si el encargado ya existe
    const [encargadoExists] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'encargado@cabanitas.com'"
    );

    if (encargadoExists.length === 0) {
      const encargadoPassword = await bcrypt.hash('encargado123', 10);
      await queryInterface.bulkInsert('users', [
        {
          email: 'encargado@cabanitas.com',
          password: encargadoPassword,
          role: 'encargado',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['admin@cabanitas.com', 'cliente@example.com', 'encargado@cabanitas.com']
      }
    }, {});
  }
};
