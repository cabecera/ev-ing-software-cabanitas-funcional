'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('item_preparacion_completados', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      preparacionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'preparacion_cabanas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tareaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tarea_preparaciones',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      completado: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      fechaCompletado: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.dropTable('item_preparacion_completados');
  }
};
