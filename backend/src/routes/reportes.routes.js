const router = require("express").Router();
const sequelize = require("../db/sequelize");
const { authRequired } = require("../middlewares/auth.middleware");

router.get("/prestamos-por-estudiante", authRequired, async (req, res) => {
  const id_grupo = req.query.id_grupo ? Number(req.query.id_grupo) : null;
  const whereGrupo = id_grupo ? "AND p.id_grupo = :id_grupo" : "";

  const [rows] = await sequelize.query(
    `
    SELECT
      g.id_grupo,
      g.nombre AS grupo,
      e.id_estudiante,
      e.nombre AS estudiante,
      p.id_prestamo,
      p.estado,
      p.fecha_salida,
      p.fecha_estimada_devolucion,
      v.id_vestuario,
      v.nombre AS vestuario,
      d.cantidad_prestada,
      d.cantidad_devuelta,
      d.cantidad_perdida,
      d.cantidad_daniada,
      (d.cantidad_prestada - (d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada)) AS pendiente
    FROM prestamos p
    JOIN grupos g ON g.id_grupo = p.id_grupo
    JOIN estudiantes e ON e.id_estudiante = p.id_estudiante
    JOIN prestamos_detalle d ON d.id_prestamo = p.id_prestamo
    JOIN vestuario v ON v.id_vestuario = d.id_vestuario
    WHERE p.estado IN ('ABIERTO','PARCIAL')
    ${whereGrupo}
    ORDER BY g.id_grupo, e.nombre, p.id_prestamo DESC, v.nombre ASC
    `,
    { replacements: { id_grupo } }
  );

  res.json(rows);
});

router.get("/inventario-por-grupo", authRequired, async (req, res) => {
  const [rows] = await sequelize.query(
    `
    SELECT
      g.id_grupo,
      g.nombre AS grupo,
      v.id_vestuario,
      v.nombre AS vestuario,
      SUM(d.cantidad_prestada - (d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada)) AS prestadas
    FROM prestamos p
    JOIN grupos g ON g.id_grupo = p.id_grupo
    JOIN prestamos_detalle d ON d.id_prestamo = p.id_prestamo
    JOIN vestuario v ON v.id_vestuario = d.id_vestuario
    WHERE p.estado IN ('ABIERTO','PARCIAL')
    GROUP BY g.id_grupo, g.nombre, v.id_vestuario, v.nombre
    HAVING prestadas > 0
    ORDER BY g.id_grupo, prestadas DESC, v.nombre ASC
    `
  );

  const [tot] = await sequelize.query(
    `
    SELECT
      (SELECT COALESCE(SUM(cantidad_total),0) FROM vestuario) AS total_general,
      (SELECT COALESCE(SUM(cantidad_disponible),0) FROM vestuario) AS disponibles,
      (SELECT COALESCE(SUM(d.cantidad_prestada - (d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada)),0)
         FROM prestamos p
         JOIN prestamos_detalle d ON d.id_prestamo = p.id_prestamo
       WHERE p.estado IN ('ABIERTO','PARCIAL')
      ) AS prestadas
    `
  );

  res.json({ resumen: rows, totales: tot[0] });
});

module.exports = router;
