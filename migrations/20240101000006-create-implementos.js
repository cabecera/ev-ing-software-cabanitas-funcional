'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('implementos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      stockTotal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      stockDisponible: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      precioPrestamo: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('implementos');
  }
};
