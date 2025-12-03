'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Eliminar la restricción UNIQUE de reservaId si existe
    try {
      await queryInterface.removeIndex('pagos', 'pagos_reservaId_unique');
    } catch (error) {
      // El índice puede no existir o tener otro nombre, continuar
      console.log('No se pudo eliminar el índice único de reservaId (puede que no exista):', error.message);
    }

    // Hacer reservaId nullable
    await queryInterface.changeColumn('pagos', 'reservaId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'reservas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    // Agregar campo prestamoImplementoId
    await queryInterface.addColumn('pagos', 'prestamoImplementoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'prestamo_implementos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    // Agregar índices únicos simples (MySQL no soporta bien índices únicos condicionales)
    // Usaremos índices normales para mejorar búsquedas
    await queryInterface.addIndex('pagos', ['reservaId'], {
      name: 'idx_pagos_reservaId'
    });

    await queryInterface.addIndex('pagos', ['prestamoImplementoId'], {
      name: 'idx_pagos_prestamoImplementoId',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar índices
    try {
      await queryInterface.removeIndex('pagos', 'idx_pagos_prestamoImplementoId');
    } catch (error) {
      console.log('Error al eliminar índice:', error.message);
    }

    try {
      await queryInterface.removeIndex('pagos', 'idx_pagos_reservaId');
    } catch (error) {
      console.log('Error al eliminar índice:', error.message);
    }

    // Eliminar columna prestamoImplementoId
    await queryInterface.removeColumn('pagos', 'prestamoImplementoId');

    // Restaurar reservaId como NOT NULL
    await queryInterface.changeColumn('pagos', 'reservaId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'reservas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    // Restaurar índice único en reservaId
    await queryInterface.addIndex('pagos', ['reservaId'], {
      unique: true,
      name: 'pagos_reservaId_unique'
    });
  }
};

