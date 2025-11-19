import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

app.get("/clientes", (req, res) => {
  db.query("SELECT * FROM clientes", (err, result) => {
    if (err) return res.json({ error: err });
    return res.json(result);
  });
});

app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));
