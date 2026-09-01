CREATE DATABASE IF NOT EXISTS lapin_daloa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lapin_daloa;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  category ENUM('entier','portion','grille','autre') NOT NULL DEFAULT 'entier',
  description TEXT,
  weight VARCHAR(50),
  price INT NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  image VARCHAR(500),
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('in','out') NOT NULL,
  quantity INT NOT NULL,
  unit_price INT NOT NULL DEFAULT 0,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(40) NOT NULL UNIQUE,
  customer_name VARCHAR(120),
  customer_phone VARCHAR(30),
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  total_amount INT NOT NULL,
  status ENUM('nouvelle','confirmee','preparee','livree','annulee') NOT NULL DEFAULT 'nouvelle',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO products (code,name,category,description,weight,price,stock,image) VALUES
('LP-001','Lapin entier préparé','entier','Lapin préparé, prêt à cuisiner.','1,2 kg',8000,'', '');
