import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // sirve frontend

// ✅ Conexión MySQL (Railway)
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Verificar conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log("✅ Conectado a MySQL en Railway");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error al conectar con MySQL:", err);
  });

// ✅ Inicializar tabla si no existe
async function initDB() {
  try {
    const conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS empleados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombreEmpleado VARCHAR(150) NOT NULL,
        direccion VARCHAR(255),
        edad INT,
        puesto VARCHAR(120),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    conn.release();
    console.log("✅ Tabla 'empleados' lista");
  } catch (err) {
    console.error("❌ Error al inicializar la base de datos:", err);
  }
}
initDB();

// ✅ Endpoints API
app.get("/api/empleados", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM empleados");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener empleados:", error);
    res.status(500).json({ error: "Error al obtener empleados", detalle: error.message });
  }
});

app.post("/api/empleados", async (req, res) => {
  const { nombreEmpleado, direccion, edad, puesto } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO empleados (nombreEmpleado, direccion, edad, puesto) VALUES (?, ?, ?, ?)",
      [nombreEmpleado, direccion, edad, puesto]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("❌ Error al registrar empleado:", error);
    res.status(500).json({ error: "Error al registrar empleado", detalle: error.message });
  }
});

app.put("/api/empleados/:id", async (req, res) => {
  const { id } = req.params;
  const { nombreEmpleado, direccion, edad, puesto } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE empleados SET nombreEmpleado=?, direccion=?, edad=?, puesto=? WHERE id=?",
      [nombreEmpleado, direccion, edad, puesto, id]
    );
    res.json({ actualizado: result.affectedRows > 0 });
  } catch (error) {
    console.error("❌ Error al actualizar empleado:", error);
    res.status(500).json({ error: "Error al actualizar empleado", detalle: error.message });
  }
});

app.delete("/api/empleados/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM empleados WHERE id = ?", [id]);
    res.json({ eliminado: result.affectedRows > 0 });
  } catch (error) {
    console.error("❌ Error al eliminar empleado:", error);
    res.status(500).json({ error: "Error al eliminar empleado", detalle: error.message });
  }
});

// ✅ Ruta fallback — devuelve el frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
