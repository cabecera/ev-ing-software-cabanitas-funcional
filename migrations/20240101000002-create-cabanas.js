'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cabanas', {
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
      capacidad: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('disponible', 'reservada', 'mantenimiento'),
        allowNull: false,
        defaultValue: 'disponible'
      },
      precioNoche: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fotos: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.dropTable('cabanas');
  }
};
