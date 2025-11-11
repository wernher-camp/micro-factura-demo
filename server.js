import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Conexión a MySQL con las variables de Railway
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

// 🔹 Ruta para obtener empleados
app.get("/api/empleados", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM empleados");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

// 🔹 Ruta para registrar empleados
app.post("/api/empleados", async (req, res) => {
  const { nombreEmpleado, direccion, edad, puesto } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO empleados (nombreEmpleado, direccion, edad, puesto) VALUES (?, ?, ?, ?)",
      [nombreEmpleado, direccion, edad, puesto]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("Error al registrar empleado:", error);
    res.status(500).json({ error: "Error al registrar empleado" });
  }
});

// 🔹 Ruta base opcional
app.get("/", (req, res) => {
  res.send("API de empleados funcionando correctamente 🚀");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
