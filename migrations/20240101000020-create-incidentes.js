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
        allowNull: false,
        references: {
          model: 'reservas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      tipo: {
        type: Sequelize.ENUM('cabana_no_disponible', 'cancelacion', 'reprogramacion', 'otro'),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('reportado', 'en_revision', 'resuelto', 'cancelado'),
        defaultValue: 'reportado'
      },
      solucionPropuesta: {
        type: Sequelize.ENUM('reprogramacion', 'reembolso', 'cambio_cabana', 'descuento'),
        allowNull: true
      },
      nuevaCabanaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'cabanas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      nuevaFechaInicio: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      nuevaFechaFin: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      clienteAcepta: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      fechaResolucion: {
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
    await queryInterface.dropTable('incidentes');
  }
};
