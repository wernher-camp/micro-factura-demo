// server.js
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
app.use(express.static(path.join(__dirname, "public")));

// --- Lectura flexible de variables de entorno (Railway compat)
const DB_HOST = process.env.MYSQLHOST || process.env.DB_HOST || process.env.DB_HOSTNAME || "localhost";
const DB_PORT = Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306);
const DB_USER = process.env.MYSQLUSER || process.env.DB_USER || "root";
const DB_PASS = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "";
const DB_NAME = process.env.MYSQLDATABASE || process.env.DB_NAME || "media_db";
const APP_PORT = Number(process.env.PORT || 8080);

// Pool
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Init DB: crear tabla si no existe
async function initDB() {
  try {
    const conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS media_items (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        type ENUM('image','video','document') NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    conn.release();
    console.log("✅ Tabla media_items lista (DB)", DB_NAME);
  } catch (err) {
    console.error("❌ Error inicializando DB:", err);
  }
}
initDB();

// --- API CRUD
app.get("/api/media", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM media_items ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error GET /api/media:", err);
    res.status(500).json({ error: "Error al obtener medios", detalle: err.message });
  }
});

app.get("/api/media/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM media_items WHERE id = ?", [req.params.id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Error GET /api/media/:id", err);
    res.status(500).json({ error: "Error al obtener medio", detalle: err.message });
  }
});

app.post("/api/media", async (req, res) => {
  try {
    const { title, type, url, description } = req.body;
    if (!title || !type || !url) return res.status(400).json({ error: "Faltan campos obligatorios" });
    const [result] = await pool.query(
      "INSERT INTO media_items (title, type, url, description) VALUES (?, ?, ?, ?)",
      [title, type, url, description || null]
    );
    const [rows] = await pool.query("SELECT * FROM media_items WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error POST /api/media:", err);
    res.status(500).json({ error: "Error al crear medio", detalle: err.message });
  }
});

app.put("/api/media/:id", async (req, res) => {
  try {
    const { title, type, url, description } = req.body;
    const { id } = req.params;
    const [r] = await pool.query(
      "UPDATE media_items SET title = ?, type = ?, url = ?, description = ? WHERE id = ?",
      [title, type, url, description || null, id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: "No encontrado" });
    const [rows] = await pool.query("SELECT * FROM media_items WHERE id = ?", [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error PUT /api/media/:id", err);
    res.status(500).json({ error: "Error al actualizar", detalle: err.message });
  }
});

app.delete("/api/media/:id", async (req, res) => {
  try {
    const [r] = await pool.query("DELETE FROM media_items WHERE id = ?", [req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /api/media/:id", err);
    res.status(500).json({ error: "Error al eliminar", detalle: err.message });
  }
});

// Fallback: servir frontend (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start
app.listen(APP_PORT, () => {
  console.log(`🚀 Media Hub corriendo en puerto ${APP_PORT}`);
  console.log("DB host:", DB_HOST, "port:", DB_PORT, "db:", DB_NAME);
});
