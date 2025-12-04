'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar trabajadorId a mantenimientos
    await queryInterface.addColumn('mantenimientos', 'trabajadorId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Agregar mantenimientoId a tarea_trabajadores
    await queryInterface.addColumn('tarea_trabajadores', 'mantenimientoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'mantenimientos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('tarea_trabajadores', 'mantenimientoId');
    await queryInterface.removeColumn('mantenimientos', 'trabajadorId');
  }
};

