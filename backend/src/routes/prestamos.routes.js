// routes/prestamos.routes.js
const router = require("express").Router();
const sequelize = require("../db/sequelize");
const { authRequired } = require("../middlewares/auth.middleware");

const Prestamo = require("../models/prestamo.model");
const PrestamoDetalle = require("../models/prestamoDetalle.model");
const Vestuario = require("../models/vestuario.model");

router.get("/ping", (req, res) => {
  res.json({ ok: true, route: "prestamos" });
});

// 🔐 Protege TODO lo que viene debajo
router.use(authRequired);

/**
 * GET /api/prestamos
 * LISTADO con IDs + nombres reales + pendientes (JOIN + SUM + GROUP BY)
 * Mejora: LEFT JOIN en detalle para no "perder" préstamos sin detalle
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await sequelize.query(`
      SELECT
        p.id_prestamo,
        p.id_profesor,
        pr.nombre AS profesor,

        p.id_grupo,
        g.nombre AS grupo,

        p.id_estudiante,
        e.nombre AS estudiante,

        p.fecha_salida,
        p.estado,

        COALESCE(SUM(
          d.cantidad_prestada
          - (d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada)
        ), 0) AS pendientes

      FROM prestamos p
      JOIN profesores pr ON pr.id_profesor = p.id_profesor
      JOIN grupos g ON g.id_grupo = p.id_grupo
      JOIN estudiantes e ON e.id_estudiante = p.id_estudiante
      LEFT JOIN prestamos_detalle d ON d.id_prestamo = p.id_prestamo

      GROUP BY
        p.id_prestamo, p.id_profesor, pr.nombre,
        p.id_grupo, g.nombre,
        p.id_estudiante, e.nombre,
        p.fecha_salida, p.estado

      ORDER BY p.id_prestamo DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/prestamos/:id
 * Ver préstamo con detalle + vestuario
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const prestamo = await Prestamo.findByPk(id);
    if (!prestamo) {
      return res.status(404).json({ message: "Préstamo no encontrado" });
    }

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

/**
 * POST /api/prestamos
 * Crear préstamo con items (detalle) y descontar stock
 * Ajuste clave: id_estudiante obligatorio y se guarda en Prestamo + Detalle
 */
router.post("/", async (req, res) => {
  const id_profesor = req.user.id_profesor; // 🔐 JWT
  const {
    id_grupo,
    id_estudiante,
    fecha_estimada_devolucion,
    observaciones,
    items,
  } = req.body;

  if (!id_grupo || !id_estudiante || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "id_grupo, id_estudiante e items son obligatorios" });
  }

  for (const it of items) {
    if (!it.id_vestuario || !it.cantidad || it.cantidad <= 0) {
      return res.status(400).json({
        message: "Cada item requiere id_vestuario y cantidad > 0",
      });
    }
  }

  const t = await sequelize.transaction();

  try {
    const prestamo = await Prestamo.create(
      {
        id_profesor,
        id_grupo,
        id_estudiante,
        fecha_salida: new Date(),
        fecha_estimada_devolucion: fecha_estimada_devolucion || null,
        observaciones: observaciones || null,
        estado: "ABIERTO",
      },
      { transaction: t }
    );

    for (const it of items) {
      const vestuario = await Vestuario.findByPk(it.id_vestuario, {
        transaction: t,
      });

      if (!vestuario) {
        throw new Error(`No existe vestuario con id ${it.id_vestuario}`);
      }

      if (vestuario.cantidad_disponible < it.cantidad) {
        throw new Error(
          `Stock insuficiente para vestuario ${it.id_vestuario}. Disponible: ${vestuario.cantidad_disponible}`
        );
      }

      await PrestamoDetalle.create(
        {
          id_prestamo: prestamo.id_prestamo,
          id_vestuario: it.id_vestuario,
          id_estudiante: id_estudiante, // ✅ mismo estudiante del préstamo
          cantidad_prestada: it.cantidad,
          cantidad_devuelta: 0,
          cantidad_perdida: 0,
          cantidad_daniada: 0,
        },
        { transaction: t }
      );

      await vestuario.update(
        {
          cantidad_disponible: vestuario.cantidad_disponible - it.cantidad,
        },
        { transaction: t }
      );
    }

    await t.commit();
    return res.status(201).json({
      message: "Préstamo creado",
      prestamo_id: prestamo.id_prestamo,
    });
  } catch (err) {
    await t.rollback();
    return res.status(400).json({
      message: err.original?.sqlMessage || err.message,
    });
  }
});

/**
 * POST /api/prestamos/:id/devolucion
 * Registrar devolución (parcial o total)
 */
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
      const detalle = await PrestamoDetalle.findByPk(it.id_detalle, {
        transaction: t,
      });

      if (!detalle || detalle.id_prestamo !== id_prestamo) {
        throw new Error(`Detalle inválido: ${it.id_detalle}`);
      }

      const devuelta = Number(it.devuelta || 0);
      const perdida = Number(it.perdida || 0);
      const daniada = Number(it.daniada || 0);

      const totalMovimiento = devuelta + perdida + daniada;
      const yaProcesado =
        detalle.cantidad_devuelta +
        detalle.cantidad_perdida +
        detalle.cantidad_daniada;

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
        const vestuario = await Vestuario.findByPk(detalle.id_vestuario, {
          transaction: t,
        });

        await vestuario.update(
          { cantidad_disponible: vestuario.cantidad_disponible + devuelta },
          { transaction: t }
        );
      }
    }

    const detalles = await PrestamoDetalle.findAll({
      where: { id_prestamo },
      transaction: t,
    });

    const todosCerrados = detalles.every((d) => {
      const p = d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada;
      return p === d.cantidad_prestada;
    });

    const algunoProcesado = detalles.some((d) => {
      const p = d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada;
      return p > 0;
    });

    await prestamo.update(
      {
        estado: todosCerrados ? "CERRADO" : algunoProcesado ? "PARCIAL" : "ABIERTO",
        fecha_devolucion_real: todosCerrados ? new Date() : null,
      },
      { transaction: t }
    );

    await t.commit();
    res.json({
      message: "Devolución registrada",
      // Ojo: prestamo.estado aquí puede quedar con el valor previo en memoria;
      // el estado real ya quedó guardado en DB.
      estado: todosCerrados ? "CERRADO" : algunoProcesado ? "PARCIAL" : "ABIERTO",
    });
  } catch (err) {
    await t.rollback();
    res.status(400).json({
      message: err.original?.sqlMessage || err.message,
    });
  }
});

module.exports = router;
