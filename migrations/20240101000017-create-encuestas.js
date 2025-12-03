'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('encuestas', {
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
      calificacionGeneral: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      calificacionLimpieza: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
      },
      calificacionServicio: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
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
    await queryInterface.dropTable('encuestas');
  }
};
