const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    {
      id_profesor: user.id_profesor,
      rol: user.rol,
      email: user.email,
      nombre: user.nombre,
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
