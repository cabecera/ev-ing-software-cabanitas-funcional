module.exports = (sequelize, DataTypes) => {
  const Mantenimiento = sequelize.define('Mantenimiento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cabanaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cabanas',
        key: 'id'
      }
    },
    implementoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'implementos',
        key: 'id'
      }
    },
    fechaInicio: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    fechaFin: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    categoria: {
      type: DataTypes.ENUM('preventivo', 'correctivo'),
      allowNull: false,
      defaultValue: 'preventivo'
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipoEspecifico: {
      type: DataTypes.ENUM(
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
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('programado', 'en_proceso', 'completado', 'cancelado'),
      defaultValue: 'programado'
    },
    prioridad: {
      type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
      allowNull: true,
      defaultValue: 'media'
    },
    inspeccionElectrica: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    revisionGas: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    mantencionEstufas: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    mantencionLeneras: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    controlMuebles: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    controlUtensilios: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    controlRopaCama: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    inspeccionAreasComunes: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    requierePersonalExterno: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    personalExterno: {
      type: DataTypes.STRING,
      allowNull: true
    },
    trabajadorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'mantenimientos',
    timestamps: true,
    validate: {
      tieneCabanaOImplemento() {
        if (!this.cabanaId && !this.implementoId) {
          throw new Error('El mantenimiento debe estar asociado a una cabaña o a un implemento');
        }
        if (this.cabanaId && this.implementoId) {
          throw new Error('El mantenimiento no puede estar asociado a una cabaña y un implemento al mismo tiempo');
        }
      }
    }
  });

  Mantenimiento.associate = function(models) {
    Mantenimiento.belongsTo(models.Cabana, { foreignKey: 'cabanaId', as: 'cabana' });
    Mantenimiento.belongsTo(models.Implemento, { foreignKey: 'implementoId', as: 'implemento' });
    Mantenimiento.belongsTo(models.User, { foreignKey: 'trabajadorId', as: 'trabajador' });
    Mantenimiento.hasMany(models.TareaTrabajador, { foreignKey: 'mantenimientoId', as: 'tareas' });
  };

  return Mantenimiento;
};

