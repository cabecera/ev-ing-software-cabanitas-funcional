module.exports = (sequelize, DataTypes) => {
  const Cabana = sequelize.define('Cabana', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    capacidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    estado: {
      type: DataTypes.ENUM('disponible', 'mantenimiento'),
      allowNull: false,
      defaultValue: 'disponible',
      comment: 'Estado físico de la cabaña. "disponible" = lista para reservar, "mantenimiento" = en reparación. La disponibilidad por fechas se calcula dinámicamente según reservas activas.'
    },
    precioNoche: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fotos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array de rutas de fotos'
    }
  }, {
    tableName: 'cabanas',
    timestamps: true
  });

  Cabana.associate = function(models) {
    Cabana.hasMany(models.Reserva, { foreignKey: 'cabanaId', as: 'reservas' });
    Cabana.hasMany(models.EntregaCabana, { foreignKey: 'cabanaId', as: 'entregas' });
    Cabana.hasMany(models.Mantenimiento, { foreignKey: 'cabanaId', as: 'mantenimientos' });
    Cabana.hasMany(models.ReporteFaltantes, { foreignKey: 'cabanaId', as: 'reportes' });
  };

  return Cabana;
};




