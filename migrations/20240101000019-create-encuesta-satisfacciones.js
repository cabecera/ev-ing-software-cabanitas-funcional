'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('encuesta_satisfacciones', {
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
      calificacionGeneral: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      calificacionLimpieza: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      calificacionServicio: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      calificacionUbicacion: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      comentarios: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      recomendaria: {
        type: Sequelize.BOOLEAN,
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
    await queryInterface.dropTable('encuesta_satisfacciones');
  }
};
