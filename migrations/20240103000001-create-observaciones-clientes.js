'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('observaciones_clientes', {
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
        onDelete: 'CASCADE'
      },
      clienteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      registradoPor: {
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
        type: Sequelize.ENUM('comportamiento', 'incidencia', 'observacion_general', 'recomendacion'),
        allowNull: false,
        defaultValue: 'observacion_general'
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      fechaObservacion: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      severidad: {
        type: Sequelize.ENUM('baja', 'media', 'alta'),
        allowNull: true,
        defaultValue: 'media'
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
    await queryInterface.dropTable('observaciones_clientes');
  }
};

