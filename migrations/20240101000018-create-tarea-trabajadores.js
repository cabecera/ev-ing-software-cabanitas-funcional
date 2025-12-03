'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tarea_trabajadores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      trabajadorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      asignadoPor: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      tipo: {
        type: Sequelize.ENUM('limpieza', 'mantenimiento', 'preparacion', 'inventario'),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      cabanaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'cabanas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      preparacionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'preparacion_cabanas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fechaAsignacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      fechaLimite: {
        type: Sequelize.DATE,
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'en_proceso', 'completada', 'cancelada'),
        defaultValue: 'pendiente'
      },
      fechaCompletado: {
        type: Sequelize.DATE,
        allowNull: true
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reporteDanios: {
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
    await queryInterface.dropTable('tarea_trabajadores');
  }
};
