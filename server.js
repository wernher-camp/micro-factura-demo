import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQL_HOST || "localhost",
  user: process.env.DB_USER || process.env.MYSQL_USER || "root",
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "",
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "empleados_db",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : (process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  const conn = await pool.getConnection();
  await conn.query(`CREATE TABLE IF NOT EXISTS empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombreEmpleado VARCHAR(150) NOT NULL,
    direccion VARCHAR(255),
    edad INT,
    puesto VARCHAR(120),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  conn.release();
  console.log("Tabla 'empleados' verificada/creada");
}

initDB().catch(err => console.error("Error al inicializar BD:", err));

app.get("/api/empleados", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM empleados ORDER BY id");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

app.get("/api/empleados/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM empleados WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener empleado" });
  }
});

app.post("/api/empleados", async (req, res) => {
  try {
    const { nombreEmpleado, direccion, edad, puesto } = req.body;
    const [result] = await pool.query(
      "INSERT INTO empleados (nombreEmpleado, direccion, edad, puesto) VALUES (?, ?, ?, ?)",
      [nombreEmpleado, direccion, edad || null, puesto]
    );
    const [rows] = await pool.query("SELECT * FROM empleados WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al crear empleado" });
  }
});

app.put("/api/empleados/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreEmpleado, direccion, edad, puesto } = req.body;
    await pool.query(
      "UPDATE empleados SET nombreEmpleado = ?, direccion = ?, edad = ?, puesto = ? WHERE id = ?",
      [nombreEmpleado, direccion, edad || null, puesto, id]
    );
    const [rows] = await pool.query("SELECT * FROM empleados WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar empleado" });
  }
});

app.delete("/api/empleados/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM empleados WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar empleado" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));