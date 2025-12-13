const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Prestamo = sequelize.define(
  "prestamo",
  {
    id_prestamo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_profesor: { type: DataTypes.INTEGER, allowNull: false },
    id_grupo: { type: DataTypes.INTEGER, allowNull: false },
    fecha_salida: { type: DataTypes.DATE, allowNull: false },
    fecha_estimada_devolucion: { type: DataTypes.DATE, allowNull: true },
    fecha_devolucion_real: { type: DataTypes.DATE, allowNull: true },
    estado: {
      type: DataTypes.ENUM("ABIERTO", "PARCIAL", "CERRADO"),
      allowNull: false,
      defaultValue: "ABIERTO",
    },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "prestamos",
    timestamps: false,
  }
);

module.exports = Prestamo;
