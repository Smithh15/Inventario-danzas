const router = require("express").Router();
const sequelize = require("../db/sequelize");
const { authRequired } = require("../middlewares/auth.middleware");

// Ping
router.get("/ping", (req, res) => {
  res.json({ ok: true, route: "grupos" });
});

// Listar grupos
router.get("/", authRequired, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT id_grupo, nombre, id_profesor_responsable, activo
       FROM grupos
       ORDER BY id_grupo DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear grupo
router.post("/", authRequired, async (req, res) => {
  const { nombre, id_profesor_responsable } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: "nombre es obligatorio" });
  }

  try {
    const [result] = await sequelize.query(
      `INSERT INTO grupos (nombre, id_profesor_responsable, activo)
       VALUES (:nombre, :id_profesor, 1)`,
      {
        replacements: {
          nombre,
          id_profesor: id_profesor_responsable || null,
        },
      }
    );

    res.status(201).json({ message: "Grupo creado", id_grupo: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Activar / desactivar grupo
router.patch("/:id/estado", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { activo } = req.body;

  if (typeof activo !== "number") {
    return res.status(400).json({ message: "activo debe ser 0 o 1" });
  }

  try {
    await sequelize.query(
      `UPDATE grupos SET activo = :activo WHERE id_grupo = :id`,
      { replacements: { activo, id } }
    );
    res.json({ message: "Estado actualizado" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
