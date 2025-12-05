'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pagos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reservaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'reservas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      metodoPago: {
        type: Sequelize.ENUM('efectivo', 'transferencia', 'tarjeta'),
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'completado', 'rechazado'),
        defaultValue: 'pendiente'
      },
      fechaPago: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('pagos');
  }
};




