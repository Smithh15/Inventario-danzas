const express = require("express");
const router = express.Router();
const Vestuario = require("../models/vestuario.model");

router.get("/", async (req, res) => {
  const items = await Vestuario.findAll({ order: [["id_vestuario", "DESC"]] });
  res.json(items);
});

router.post("/", async (req, res) => {
  const { nombre, tipo, talla, cantidad_total } = req.body;

  if (!nombre || cantidad_total == null) {
    return res.status(400).json({ message: "nombre y cantidad_total son obligatorios" });
  }

  const total = Number(cantidad_total);

  const item = await Vestuario.create({
    nombre,
    tipo,
    talla,
    cantidad_total: total,
    cantidad_disponible: total,
    estado_general: "ACTIVO",
  });

  res.status(201).json(item);
});

module.exports = router;
