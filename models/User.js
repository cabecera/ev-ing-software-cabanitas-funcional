module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'encargado', 'cliente', 'trabajador'),
      allowNull: false,
      defaultValue: 'cliente'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.associate = function(models) {
    User.hasOne(models.Cliente, { foreignKey: 'userId', as: 'cliente' });
  };

  return User;
};
