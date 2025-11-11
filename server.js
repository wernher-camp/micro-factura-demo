import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Crear conexión al pool de MySQL usando las variables del .env
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// 🔍 Prueba conexión
pool.query("SELECT 1")
  .then(() => console.log("✅ Conexión a MySQL establecida correctamente"))
  .catch(err => console.error("❌ Error al conectar a MySQL:", err));

// GET empleados
app.get("/api/empleados", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM empleados");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

// POST empleados
app.post("/api/empleados", async (req, res) => {
  const { nombreEmpleado, direccion, edad, puesto } = req.body;
  try {
    await pool.query(
      "INSERT INTO empleados (nombreEmpleado, direccion, edad, puesto) VALUES (?, ?, ?, ?)",
      [nombreEmpleado, direccion, edad, puesto]
    );
    res.json({ message: "Empleado registrado correctamente" });
  } catch (error) {
    console.error("Error al registrar empleado:", error);
    res.status(500).json({ error: "Error al registrar empleado" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
