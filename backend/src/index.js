
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const gruposRoutes = require("./routes/grupos.routes");
const sequelize = require("./db/sequelize");
const profesoresRoutes = require("./routes/profesores.routes");
const vestuarioRoutes = require("./routes/vestuario.routes");
const prestamosRoutes = require("./routes/prestamos.routes");
const authRoutes = require("./routes/auth.routes");
const app = express();
const estudiantesRoutes = require("./routes/estudiantes.routes");
const reportesRoutes = require("./routes/reportes.routes");

app.use(cors());
app.use(express.json());
app.use("/api/profesores", profesoresRoutes);
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/grupos", gruposRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vestuario", vestuarioRoutes);
app.use("/api/prestamos", prestamosRoutes);
app.use("/api/estudiantes", estudiantesRoutes);
app.use("/api/reportes", reportesRoutes);

app.get("/api/_whoami", (req, res) => {
  res.json({ ok: true, file: "src/index.js", time: new Date().toISOString() });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`API running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log("DB connected");
  } catch (err) {
    console.log("DB error:", err.message);
  }
});
