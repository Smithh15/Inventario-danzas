const router = require("express").Router();
const { authRequired } = require("../middlewares/auth.middleware");
const Estudiante = require("../models/estudiante.model");

router.get("/ping", (req, res) => res.json({ ok: true, route: "estudiantes" }));

// GET /api/estudiantes?id_grupo=2
router.get("/", authRequired, async (req, res) => {
  try {
    const id_grupo = req.query.id_grupo ? Number(req.query.id_grupo) : null;

    const where = {};
    if (id_grupo) where.id_grupo = id_grupo;

    const estudiantes = await Estudiante.findAll({
      where,
      order: [["id_estudiante", "DESC"]],
    });

    res.json(estudiantes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/estudiantes  { id_grupo, nombre }
router.post("/", authRequired, async (req, res) => {
  try {
    const { id_grupo, nombre } = req.body;

    if (!id_grupo || !nombre?.trim()) {
      return res.status(400).json({ message: "id_grupo y nombre son obligatorios" });
    }

    // Si tu tabla aún NO tiene 'activo', esto fallará con "Unknown column activo"
    const estudiante = await Estudiante.create({
      id_grupo: Number(id_grupo),
      nombre: nombre.trim(),
      activo: 1,
    });

    res.status(201).json(estudiante);
  } catch (err) {
    res.status(400).json({ message: err.original?.sqlMessage || err.message });
  }
});

// PATCH /api/estudiantes/:id/estado  { activo: 0/1 }
router.patch("/:id/estado", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { activo } = req.body;

    const estudiante = await Estudiante.findByPk(id);
    if (!estudiante) return res.status(404).json({ message: "Estudiante no encontrado" });

    await estudiante.update({ activo: Number(activo) ? 1 : 0 });
    res.json({ message: "Estado actualizado", estudiante });
  } catch (err) {
    res.status(400).json({ message: err.original?.sqlMessage || err.message });
  }
});

module.exports = router;
