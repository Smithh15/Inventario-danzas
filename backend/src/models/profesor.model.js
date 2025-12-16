const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Profesor = sequelize.define(
  "profesores",
  {
    id_profesor: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(20),
    },
    rol: {
      type: DataTypes.ENUM("ADMIN", "PROFESOR"),
      defaultValue: "PROFESOR",
    },
    activo: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
  },
  {
    tableName: "profesores",
    timestamps: false,
  }
);

module.exports = Profesor;
