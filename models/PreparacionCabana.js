module.exports = (sequelize, DataTypes) => {
  const PreparacionCabana = sequelize.define('PreparacionCabana', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reservaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'reservas',
        key: 'id'
      }
    },
    cabanaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cabanas',
        key: 'id'
      }
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fechaCompletado: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_proceso', 'completada'),
      defaultValue: 'pendiente'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'preparacion_cabanas',
    timestamps: true
  });

  PreparacionCabana.associate = function(models) {
    PreparacionCabana.belongsTo(models.Reserva, { foreignKey: 'reservaId', as: 'reserva' });
    PreparacionCabana.belongsTo(models.Cabana, { foreignKey: 'cabanaId', as: 'cabana' });
    PreparacionCabana.hasMany(models.ItemPreparacionCompletado, { foreignKey: 'preparacionId', as: 'tareasCompletadas' });
    PreparacionCabana.hasMany(models.TareaTrabajador, { foreignKey: 'preparacionId', as: 'tareasTrabajadores' });
  };

  return PreparacionCabana;
};
