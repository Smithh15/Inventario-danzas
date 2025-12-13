require("dotenv").config();
const express = require("express");
const cors = require("cors");
const prestamosRoutes = require("./routes/prestamos.routes");
const sequelize = require("./db/sequelize");
const vestuarioRoutes = require("./routes/vestuario.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});


// ✅ SOLO routers aquí
app.use("/api/vestuario", vestuarioRoutes);
app.use("/api/prestamos", prestamosRoutes)

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    console.log("DB connected");
  } catch (err) {
    console.error("DB error:", err.message);
  }
});
