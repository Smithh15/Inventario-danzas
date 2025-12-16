// models/prestamoDetalle.model.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const PrestamoDetalle = sequelize.define(
  "prestamos_detalle",
  {
    id_detalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_prestamo: { type: DataTypes.INTEGER, allowNull: false },
    id_vestuario: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_prestada: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_devuelta: { type: DataTypes.INTEGER, defaultValue: 0 },
    cantidad_perdida: { type: DataTypes.INTEGER, defaultValue: 0 },
    cantidad_daniada: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "prestamos_detalle", timestamps: false }
);

module.exports = PrestamoDetalle;
