'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mantenimientos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cabanaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cabanas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      fechaInicio: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      fechaFin: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('programado', 'en_proceso', 'completado', 'cancelado'),
        defaultValue: 'programado'
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
    await queryInterface.dropTable('mantenimientos');
  }
};
