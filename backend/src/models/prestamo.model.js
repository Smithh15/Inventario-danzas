// models/prestamo.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Prestamo = sequelize.define(
  "prestamos",
  {
    id_prestamo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_profesor: { type: DataTypes.INTEGER, allowNull: false },
    id_grupo: { type: DataTypes.INTEGER, allowNull: false },
    id_estudiante: { type: DataTypes.INTEGER, allowNull: false }, // ✅ NUEVO
    fecha_salida: { type: DataTypes.DATE, allowNull: false },
    fecha_estimada_devolucion: { type: DataTypes.DATE, allowNull: true },
    fecha_devolucion_real: { type: DataTypes.DATE, allowNull: true },
    observaciones: { type: DataTypes.STRING(500), allowNull: true },
    estado: { type: DataTypes.ENUM("ABIERTO", "PARCIAL", "CERRADO"), defaultValue: "ABIERTO" },
  },
  { tableName: "prestamos", timestamps: false }
);

module.exports = Prestamo;
