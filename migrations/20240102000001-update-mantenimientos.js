'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hacer cabanaId nullable para permitir mantenimientos de implementos
    await queryInterface.changeColumn('mantenimientos', 'cabanaId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'cabanas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    // Agregar categoria (preventivo/correctivo)
    await queryInterface.addColumn('mantenimientos', 'categoria', {
      type: Sequelize.ENUM('preventivo', 'correctivo'),
      allowNull: false,
      defaultValue: 'preventivo'
    });

    // Agregar tipoEspecifico
    await queryInterface.addColumn('mantenimientos', 'tipoEspecifico', {
      type: Sequelize.ENUM(
        'limpieza_profunda',
        'inspeccion_electrica',
        'revision_gas',
        'mantencion_estufas',
        'mantencion_leneras',
        'control_muebles',
        'control_utensilios',
        'control_ropa_cama',
        'inspeccion_areas_comunes',
        'reparacion_electrodomesticos',
        'reparacion_muebles',
        'reparacion_utensilios',
        'reparacion_infraestructura',
        'reparacion_implementos_recreativos',
        'otro'
      ),
      allowNull: true
    });

    // Agregar implementoId para soportar mantenimiento de implementos
    await queryInterface.addColumn('mantenimientos', 'implementoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'implementos',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    // Agregar campos específicos de inspección
    await queryInterface.addColumn('mantenimientos', 'inspeccionElectrica', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('mantenimientos', 'revisionGas', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('mantenimientos', 'mantencionEstufas', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('mantenimientos', 'mantencionLeneras', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('mantenimientos', 'controlMuebles', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('mantenimientos', 'controlUtensilios', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('mantenimientos', 'controlRopaCama', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('mantenimientos', 'inspeccionAreasComunes', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    // Agregar prioridad
    await queryInterface.addColumn('mantenimientos', 'prioridad', {
      type: Sequelize.ENUM('baja', 'media', 'alta', 'urgente'),
      allowNull: true,
      defaultValue: 'media'
    });

    // Agregar campo para personal externo
    await queryInterface.addColumn('mantenimientos', 'requierePersonalExterno', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false
    });

    await queryInterface.addColumn('mantenimientos', 'personalExterno', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('mantenimientos', 'personalExterno');
    await queryInterface.removeColumn('mantenimientos', 'requierePersonalExterno');
    await queryInterface.removeColumn('mantenimientos', 'prioridad');
    await queryInterface.removeColumn('mantenimientos', 'inspeccionAreasComunes');
    await queryInterface.removeColumn('mantenimientos', 'controlRopaCama');
    await queryInterface.removeColumn('mantenimientos', 'controlUtensilios');
    await queryInterface.removeColumn('mantenimientos', 'controlMuebles');
    await queryInterface.removeColumn('mantenimientos', 'mantencionLeneras');
    await queryInterface.removeColumn('mantenimientos', 'mantencionEstufas');
    await queryInterface.removeColumn('mantenimientos', 'revisionGas');
    await queryInterface.removeColumn('mantenimientos', 'inspeccionElectrica');
    await queryInterface.removeColumn('mantenimientos', 'implementoId');
    await queryInterface.removeColumn('mantenimientos', 'tipoEspecifico');
    await queryInterface.removeColumn('mantenimientos', 'categoria');

    // Restaurar cabanaId a NOT NULL (cuidado si hay datos)
    await queryInterface.changeColumn('mantenimientos', 'cabanaId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'cabanas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  }
};




