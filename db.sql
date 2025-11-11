CREATE DATABASE IF NOT EXISTS empleados_db;
USE empleados_db;

CREATE TABLE IF NOT EXISTS empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombreEmpleado VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) DEFAULT NULL,
  edad INT DEFAULT NULL,
  puesto VARCHAR(120) DEFAULT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO empleados (nombreEmpleado, direccion, edad, puesto)
VALUES ('Juan Perez','Calle Falsa 123',30,'Vendedor');