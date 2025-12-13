const router = require("express").Router();
const sequelize = require("../db/sequelize");

const Prestamo = require("../models/prestamo.model");
const PrestamoDetalle = require("../models/prestamoDetalle.model");
const Vestuario = require("../models/vestuario.model");

router.get("/ping", (req, res) => {
  res.json({ ok: true, route: "prestamos" });
});

// Listar préstamos (cabecera)
router.get("/", async (req, res) => {
  try {
    const prestamos = await Prestamo.findAll({
      order: [["id_prestamo", "DESC"]],
    });
    res.json(prestamos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Ver un préstamo con su detalle + vestuario
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const prestamo = await Prestamo.findByPk(id);
    if (!prestamo) return res.status(404).json({ message: "Préstamo no encontrado" });

    const detalles = await PrestamoDetalle.findAll({
      where: { id_prestamo: id },
      order: [["id_detalle", "ASC"]],
    });

    const detallesConVestuario = [];
    for (const d of detalles) {
      const v = await Vestuario.findByPk(d.id_vestuario);
      detallesConVestuario.push({
        ...d.toJSON(),
        vestuario: v ? v.toJSON() : null,
      });
    }

    res.json({ prestamo, detalles: detallesConVestuario });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear préstamo (cabecera + detalle) y descontar stock
router.post("/", async (req, res) => {
  const { id_profesor, id_grupo, fecha_estimada_devolucion, observaciones, items } = req.body;

  if (!id_profesor || !id_grupo || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "id_profesor, id_grupo e items son obligatorios" });
  }

  for (const it of items) {
    if (!it.id_vestuario || !it.cantidad || it.cantidad <= 0) {
      return res.status(400).json({ message: "Cada item requiere id_vestuario y cantidad > 0" });
    }
  }

  const t = await sequelize.transaction();

  try {
    const prestamo = await Prestamo.create(
      {
        id_profesor,
        id_grupo,
        fecha_salida: new Date(),
        fecha_estimada_devolucion: fecha_estimada_devolucion || null,
        observaciones: observaciones || null,
        estado: "ABIERTO",
      },
      { transaction: t }
    );

    for (const it of items) {
      const vestuario = await Vestuario.findByPk(it.id_vestuario, { transaction: t });

      if (!vestuario) throw new Error(`No existe vestuario con id ${it.id_vestuario}`);

      if (vestuario.cantidad_disponible < it.cantidad) {
        throw new Error(
          `Stock insuficiente para vestuario id ${it.id_vestuario}. Disponible: ${vestuario.cantidad_disponible}`
        );
      }

      await PrestamoDetalle.create(
        {
          id_prestamo: prestamo.id_prestamo,
          id_vestuario: it.id_vestuario,
          id_estudiante: it.id_estudiante || null,
          cantidad_prestada: it.cantidad,
          cantidad_devuelta: 0,
          cantidad_perdida: 0,
          cantidad_daniada: 0,
        },
        { transaction: t }
      );

      await vestuario.update(
        { cantidad_disponible: vestuario.cantidad_disponible - it.cantidad },
        { transaction: t }
      );
    }

    await t.commit();
    return res.status(201).json({ message: "Préstamo creado", prestamo_id: prestamo.id_prestamo });
  } catch (err) {
    await t.rollback();
    return res.status(400).json({ message: err.original?.sqlMessage || err.message });
  }
});

// Registrar devolución parcial/total
router.post("/:id/devolucion", async (req, res) => {
  const id_prestamo = Number(req.params.id);
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items es obligatorio" });
  }

  const t = await sequelize.transaction();

  try {
    const prestamo = await Prestamo.findByPk(id_prestamo, { transaction: t });
    if (!prestamo) throw new Error("Préstamo no encontrado");

    for (const it of items) {
      const detalle = await PrestamoDetalle.findByPk(it.id_detalle, { transaction: t });
      if (!detalle || detalle.id_prestamo !== id_prestamo) {
        throw new Error(`Detalle inválido: ${it.id_detalle}`);
      }

      const devuelta = Number(it.devuelta || 0);
      const perdida = Number(it.perdida || 0);
      const daniada = Number(it.daniada || 0);

      const totalMovimiento = devuelta + perdida + daniada;
      const yaProcesado = detalle.cantidad_devuelta + detalle.cantidad_perdida + detalle.cantidad_daniada;

      if (yaProcesado + totalMovimiento > detalle.cantidad_prestada) {
        throw new Error(`Te pasaste devolviendo en el detalle ${detalle.id_detalle}`);
      }

      await detalle.update(
        {
          cantidad_devuelta: detalle.cantidad_devuelta + devuelta,
          cantidad_perdida: detalle.cantidad_perdida + perdida,
          cantidad_daniada: detalle.cantidad_daniada + daniada,
        },
        { transaction: t }
      );

      if (devuelta > 0) {
        const vestuario = await Vestuario.findByPk(detalle.id_vestuario, { transaction: t });
        await vestuario.update(
          { cantidad_disponible: vestuario.cantidad_disponible + devuelta },
          { transaction: t }
        );
      }
    }

    const detalles = await PrestamoDetalle.findAll({ where: { id_prestamo }, transaction: t });

    const todosCerrados = detalles.every((d) => {
      const procesado = d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada;
      return procesado === d.cantidad_prestada;
    });

    const algunoProcesado = detalles.some((d) => {
      const procesado = d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada;
      return procesado > 0;
    });

    await prestamo.update(
      {
        estado: todosCerrados ? "CERRADO" : (algunoProcesado ? "PARCIAL" : "ABIERTO"),
        fecha_devolucion_real: todosCerrados ? new Date() : null,
      },
      { transaction: t }
    );

    await t.commit();
    res.json({ message: "Devolución registrada", estado: prestamo.estado });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ message: err.original?.sqlMessage || err.message });
  }
});

module.exports = router;
