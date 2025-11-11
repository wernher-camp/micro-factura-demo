import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

// 🔹 Conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "empleados",
  port: process.env.DB_PORT || 3306,
});

// 🔹 Obtener todos los empleados
app.get("/api/empleados", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM empleados");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res.status(500).json({ error: "Error al obtener empleados" });
  }
});

// 🔹 Registrar un empleado nuevo
app.post("/api/empleados", async (req, res) => {
  try {
    const { nombreEmpleado, direccion, edad, puesto } = req.body;

    if (!nombreEmpleado || !direccion || !edad || !puesto) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const [result] = await pool.query(
      "INSERT INTO empleados (nombreEmpleado, direccion, edad, puesto) VALUES (?, ?, ?, ?)",
      [nombreEmpleado, direccion, edad, puesto]
    );

    res.json({
      id: result.insertId,
      nombreEmpleado,
      direccion,
      edad,
      puesto,
    });
  } catch (error) {
    console.error("Error al registrar empleado:", error);
    res.status(500).json({
      error: "Error al registrar empleado",
      detalle: error.message,
    });
  }
});

// 🔹 Editar empleado existente (corregido)
app.put("/api/empleados/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreEmpleado, direccion, edad, puesto } = req.body;

    if (!nombreEmpleado || !direccion || !edad || !puesto) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const [result] = await pool.query(
      "UPDATE empleados SET nombreEmpleado = ?, direccion = ?, edad = ?, puesto = ? WHERE id = ?",
      [nombreEmpleado, direccion, edad, puesto, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    // 🔹 Respuesta JSON válida
    res.json({
      message: "Empleado actualizado correctamente",
      id,
      nombreEmpleado,
      direccion,
      edad,
      puesto,
    });
  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    res.status(500).json({
      error: "Error al actualizar empleado",
      detalle: error.message,
    });
  }
});

// 🔹 Eliminar empleado
app.delete("/api/empleados/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM empleados WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    res.json({ message: "Empleado eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    res.status(500).json({
      error: "Error al eliminar empleado",
      detalle: error.message,
    });
  }
});

// 🔹 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
