'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('incidentes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reservaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'reservas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      clienteId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      tipo: {
        type: Sequelize.ENUM('no_disponible', 'daño', 'servicio', 'otro'),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'en_revision', 'resuelto', 'cancelado'),
        defaultValue: 'pendiente'
      },
      solucionPropuesta: {
        type: Sequelize.ENUM('reprogramar', 'reembolso', 'cambio_cabana', 'descuento', 'otro'),
        allowNull: true
      },
      solucionAceptada: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      fechaResolucion: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resueltoPor: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('incidentes');
  }
};




