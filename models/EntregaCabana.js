module.exports = (sequelize, DataTypes) => {
  const EntregaCabana = sequelize.define('EntregaCabana', {
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
    checklistId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'checklist_inventarios',
        key: 'id'
      }
    },
    fechaEntrega: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'completada', 'con_observaciones'),
      defaultValue: 'pendiente'
    }
  }, {
    tableName: 'entrega_cabanas',
    timestamps: true
  });

  EntregaCabana.associate = function(models) {
    EntregaCabana.belongsTo(models.Reserva, { foreignKey: 'reservaId', as: 'reserva' });
    EntregaCabana.belongsTo(models.Cabana, { foreignKey: 'cabanaId', as: 'cabana' });
    EntregaCabana.belongsTo(models.ChecklistInventario, { foreignKey: 'checklistId', as: 'checklist' });
    EntregaCabana.hasMany(models.ItemVerificacion, { foreignKey: 'entregaId', as: 'itemsVerificacion' });
  };

  return EntregaCabana;
};

