const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Vestuario = sequelize.define(
  "Vestuario",
  {
    id_vestuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    tipo: { type: DataTypes.STRING(50), allowNull: true },
    talla: { type: DataTypes.STRING(10), allowNull: true },
    cantidad_total: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_disponible: { type: DataTypes.INTEGER, allowNull: false },
    estado_general: {
      type: DataTypes.ENUM("ACTIVO", "EN_REVISION", "BAJA"),
      allowNull: false,
      defaultValue: "ACTIVO",
    },
  },
  {
    tableName: "vestuario",
    timestamps: false,
  }
);

module.exports = Vestuario;
