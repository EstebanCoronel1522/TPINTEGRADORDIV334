-- Base de datos para el Trabajo Integrador Autoservicio
-- Programación III - División 334

CREATE DATABASE IF NOT EXISTS `tp_autoservicio` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `tp_autoservicio`;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `products`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `category` ENUM('perifericos', 'componentes') NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `is_admin` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `sales`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_price` DECIMAL(10,2) NOT NULL,
  `user_name` VARCHAR(240) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Estructura de tabla para la tabla `product_sales`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_sales` (
  `product_id` INT NOT NULL,
  `sale_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`product_id`, `sale_id`),
  KEY `sale_id` (`sale_id`),
  CONSTRAINT `fk_product_sales_products` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_product_sales_sales` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Datos iniciales para `products` (Hardware: Periféricos y Componentes)
-- --------------------------------------------------------
INSERT INTO `products` (`id`, `name`, `image`, `category`, `price`, `active`) VALUES
(1, 'Teclado Mecánico RGB Redragon Kumara', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', 'perifericos', 45000.00, 1),
(2, 'Mouse Gamer Logitech G502 Hero', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80', 'perifericos', 38000.00, 1),
(3, 'Auriculares HyperX Cloud Flight Wireless', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', 'perifericos', 82000.00, 1),
(4, 'Mousepad XXL Gaming Speed', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80', 'perifericos', 18000.00, 1),
(5, 'Micrófono Condensador USB FIFINE', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80', 'perifericos', 52000.00, 1),
(6, 'Webcam Logitech C920 Full HD', 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=600&q=80', 'perifericos', 65000.00, 1),
(7, 'Memoria RAM Corsair Vengeance 16GB DDR4', 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=600&q=80', 'componentes', 42000.00, 1),
(8, 'Disco SSD NVMe Kingston 1TB M.2', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80', 'componentes', 68000.00, 1),
(9, 'Placa de Video GeForce RTX 4060 8GB', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=600&q=80', 'componentes', 340000.00, 1),
(10, 'Fuente de Poder Gigabyte 750W 80 Plus Gold', 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=600&q=80', 'componentes', 95000.00, 1),
(11, 'Gabinete ATX Cooler Master Vidrio Templado', 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80', 'componentes', 78000.00, 1),
(12, 'Cooler CPU Deepcool Gammaxx AG400', 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=600&q=80', 'componentes', 29000.00, 1);

-- --------------------------------------------------------
-- Datos iniciales para `users` (password hasheado para 'admin123')
-- Hash bcrypt de 'admin123': $2b$10$X5xOuPjJxJcNVx1Oz2il9.YQe1yGlqejsnz1TLxk02ymk4kEWWVoi
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password`, `is_admin`) VALUES
(1, 'Administrador General', 'admin@autoservicio.com', '$2b$10$X5xOuPjJxJcNVx1Oz2il9.YQe1yGlqejsnz1TLxk02ymk4kEWWVoi', 1);
