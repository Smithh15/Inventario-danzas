const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Estudiante = sequelize.define("estudiantes", {
  id_estudiante: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_grupo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  activo: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
  },
}, {
  tableName: "estudiantes",
  timestamps: false,
});

module.exports = Estudiante;
