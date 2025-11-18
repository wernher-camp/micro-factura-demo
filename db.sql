-- Crea la base de datos si hace falta (opcional)
CREATE DATABASE IF NOT EXISTS media_db;
USE media_db;

CREATE TABLE IF NOT EXISTS media_items (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  type ENUM('image','video','document') NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
