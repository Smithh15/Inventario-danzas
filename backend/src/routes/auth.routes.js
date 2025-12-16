console.log("AUTH ROUTES LOADED");

const router = require("express").Router();
const bcrypt = require("bcryptjs");
const sequelize = require("../db/sequelize");
const { signToken } = require("../utils/jwt");

// ✅ PING para probar que el mount funciona
router.get("/ping", (req, res) => {
  res.json({ ok: true, route: "auth" });
});

// ✅ LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email y password son obligatorios" });
  }

  try {
    const [rows] = await sequelize.query(
      `SELECT id_profesor, nombre, email, rol, activo, password_hash
       FROM profesores
       WHERE email = :email
       LIMIT 1`,
      { replacements: { email } }
    );

    const user = rows?.[0];
    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });
    if (!user.activo) return res.status(403).json({ message: "Usuario inactivo" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = signToken({
      id_profesor: user.id_profesor,
      rol: user.rol,
      email: user.email,
      nombre: user.nombre,
    });

    return res.json({
      token,
      user: {
        id_profesor: user.id_profesor,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
