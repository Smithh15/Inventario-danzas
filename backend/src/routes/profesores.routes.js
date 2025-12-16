const router = require("express").Router();
const bcrypt = require("bcryptjs");
const sequelize = require("../db/sequelize");
const { authRequired } = require("../middlewares/auth.middleware");

// Ping
router.get("/ping", (req, res) => {
  res.json({ ok: true, route: "profesores" });
});

// Listar profesores
router.get("/", authRequired, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT id_profesor, nombre, email, rol, activo
       FROM profesores
       ORDER BY id_profesor DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear profesor
router.post("/", authRequired, async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: "nombre, email y password son obligatorios" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    await sequelize.query(
      `INSERT INTO profesores (nombre, email, password_hash, rol, activo)
       VALUES (:nombre, :email, :password_hash, :rol, 1)`,
      {
        replacements: {
          nombre,
          email,
          password_hash: hash,
          rol: rol || "PROFESOR",
        },
      }
    );

    res.status(201).json({ message: "Profesor creado" });
  } catch (err) {
    // email duplicado u otro error
    res.status(400).json({ message: err.original?.sqlMessage || err.message });
  }
});

// Activar / desactivar profesor
router.patch("/:id/estado", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { activo } = req.body;

  if (typeof activo !== "number") {
    return res.status(400).json({ message: "activo debe ser 0 o 1" });
  }

  try {
    await sequelize.query(
      `UPDATE profesores SET activo = :activo WHERE id_profesor = :id`,
      { replacements: { activo, id } }
    );
    res.json({ message: "Estado actualizado" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
