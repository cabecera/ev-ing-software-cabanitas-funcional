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
        onDelete: 'CASCADE'
      },
      tipo: {
        type: Sequelize.ENUM('limpieza', 'mantenimiento', 'inventario', 'otro'),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      fechaAsignada: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      fechaCompletada: {
        type: Sequelize.DATE,
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'en_proceso', 'completada', 'cancelada'),
        defaultValue: 'pendiente'
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reporteDanos: {
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




