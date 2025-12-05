'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      clienteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
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
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      fechaFin: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'confirmada', 'cancelada', 'completada'),
        allowNull: false,
        defaultValue: 'pendiente'
      },
      confirmacion_cliente: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      montoCotizado: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
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
    await queryInterface.dropTable('reservas');
  }
};




