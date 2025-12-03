'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('preparacion_cabanas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reservaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reservas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      fechaCompletado: {
        type: Sequelize.DATE,
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'en_proceso', 'completada'),
        defaultValue: 'pendiente'
      },
      observaciones: {
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
    await queryInterface.dropTable('preparacion_cabanas');
  }
};
