-- MySQL dump 10.13  Distrib 8.0.43, for macos15 (arm64)
--
-- Host: localhost    Database: ecommerce_slim
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `brand`
--

DROP TABLE IF EXISTS `brand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brand` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_brand_name` (`name`),
  UNIQUE KEY `uk_brand_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brand`
--

LOCK TABLES `brand` WRITE;
/*!40000 ALTER TABLE `brand` DISABLE KEYS */;
INSERT INTO `brand` VALUES (1,'Apple','apple',NULL,NULL),(2,'Samsung','samsung',NULL,NULL),(3,'Xiaomi','xiaomi',NULL,NULL),(4,'Oppo','oppo',NULL,NULL),(5,'Vivo','vivo',NULL,NULL),(6,'Realme','realme',NULL,NULL),(7,'Huawei','huawei',NULL,NULL),(8,'Sony','sony',NULL,NULL),(9,'LG','lg',NULL,NULL),(10,'Asus','asus',NULL,NULL),(11,'Acer','acer',NULL,NULL),(12,'Dell','dell',NULL,NULL),(13,'HP','hp',NULL,NULL),(14,'Lenovo','lenovo',NULL,NULL),(15,'MSI','msi',NULL,NULL),(16,'Razer','razer',NULL,NULL),(17,'Logitech','logitech',NULL,NULL),(18,'JBL','jbl',NULL,NULL),(19,'Bose','bose',NULL,NULL);
/*!40000 ALTER TABLE `brand` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  `price_at_add` decimal(12,2) NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cart_product` (`cart_id`,`product_id`),
  KEY `fk_ci_product` (`product_id`),
  CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ci_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
  CONSTRAINT `cart_items_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhqknmjh5423vchi4xkyhxlhg2` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'Laptop','laptop'),(2,'Screen','screen'),(3,'Phone','phone'),(4,'Headphone','headphone'),(5,'Accessories','accessories');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned NOT NULL,
  `staff_id` bigint unsigned NOT NULL,
  `status` enum('OPEN','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_conv_pair` (`customer_id`,`staff_id`),
  KEY `fk_conv_staff` (`staff_id`),
  CONSTRAINT `fk_conv_cust` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conv_staff` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint unsigned NOT NULL,
  `sender_id` bigint unsigned NOT NULL,
  `body` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_user` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `name_snapshot` varchar(220) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `quantity` int NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `fk_oi_product` (`product_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_items_chk_1` CHECK ((`quantity` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `order_number` varchar(30) NOT NULL,
  `status` enum('PENDING','SHIPPING','DELIVERED') NOT NULL DEFAULT 'PENDING',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_method` varchar(40) DEFAULT NULL,
  `payment_status` enum('UNPAID','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  `paid_at` datetime DEFAULT NULL,
  `shipping_address_text` varchar(255) NOT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `placed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `placed_at` (`placed_at`),
  KEY `payment_status` (`payment_status`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `image_url` varchar(255) DEFAULT NULL,
  `name` varchar(180) NOT NULL,
  `description_short` text,
  `description_long` text,
  `price` decimal(12,2) NOT NULL,
  `category_id` bigint NOT NULL,
  `brand_id` bigint unsigned DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FK1mtsbur82frn64de7balymq9s` (`category_id`),
  KEY `fk_product_brand` (`brand_id`),
  CONSTRAINT `FK1mtsbur82frn64de7balymq9s` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`),
  CONSTRAINT `fk_product_brand` FOREIGN KEY (`brand_id`) REFERENCES `brand` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (9,'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcShC7z7SE24Fwr1rw5UnJffjeKABrqVLQceAMJ_cLRYEXJpz1_egAG5axxRzmJ8unG9hUrKIKWHf-Ed9d6vlDge-h_mcGNuOlll-tfqgrxUzvzh-oOotqyBks6-GSyQFwBVQ3fC3A&usqp=CAc','Laptop Asus TUF','CPU Ryzen 7 7840HS\nGPU RTX 4060\nRAM 16GB\nSSD 512GB\nMàn hình 15.6\" 144Hz\nPin 90Wh','Laptop Asus TUF sở hữu hiệu năng mạnh mẽ nhờ CPU Ryzen thế hệ mới kết hợp GPU RTX, mang lại khả năng xử lý game và đồ họa cực mượt. Thiết kế bền bỉ đạt chuẩn quân đội MIL-STD-810H giúp máy chịu được va đập và môi trường khắc nghiệt. Màn hình 15.6\" tốc độ làm tươi 144Hz cho trải nghiệm thị giác mượt mà khi chơi game FPS. Hệ thống tản nhiệt tối ưu đảm bảo nhiệt độ luôn ổn định trong mọi tác vụ nặng. Đây là lựa chọn lý tưởng cho game thủ và người làm đồ họa 3D.',19000000.00,1,10,19),(12,'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTuRMZseIyw4IWY0MtHVpuZC_PGkeX_iOx6rUx1ryDy6HuUmpf9anvthV2MXmHLAiXBF7NmkPl2p0ER3qhoRblhx0ba2oSUthhqiNeFUHbQpevopxBXCm6xRQ','iPhone 15 Pro Max','Chip A17 Pro\nMàn hình 6.7\" Super Retina XDR\nCamera 48MP\nZoom quang 5x\nPin 4422mAh\nUSB-C','iPhone 15 Pro Max đánh dấu bước tiến lớn với khung titan siêu nhẹ và bền, mang lại cảm giác cầm nắm cao cấp. Chip A17 Pro mới giúp hiệu năng vượt trội, chơi game console-quality mượt mà. Camera 48MP nâng cấp, hỗ trợ zoom quang 5x, ProRAW và quay video ProRes cho chất lượng hình ảnh chuyên nghiệp. Màn hình Super Retina XDR 6.7\" tuyệt đẹp, sáng hơn và hiển thị sắc nét ngay cả ngoài trời. Pin 4422mAh cho thời gian sử dụng dài. USB-C mới giúp truyền dữ liệu nhanh hơn.',34900000.00,3,1,20),(13,'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTm5st6VfI9dcA9YWh34AkXHVGz2xEUcgGRpjLM0frPBrl_5bC6ZP4nL5eD3g0R7FLWDxnQb8lGiUlnY7yWFy_bsTO6abKq3bk1xgNC7ZFWR5-sMX12G9OaRA','Samsung Galaxy S24 Ultra','Chip Snapdragon 8 Gen 3\nMàn hình 6.8\" AMOLED 2X\nCamera 200MP\nZoom 100x\nPin 5000mAh\nS-Pen','Samsung Galaxy S24 Ultra sở hữu khung titanium cứng cáp, camera 200MP cho khả năng chụp ảnh đỉnh cao trong mọi điều kiện ánh sáng. Công nghệ AI mới hỗ trợ xử lý ảnh và quay video sắc nét hơn. Màn hình Dynamic AMOLED 2X 120Hz siêu mượt. Chip Snapdragon 8 Gen 3 mạnh mẽ giúp chơi game và đa nhiệm hoàn hảo. Dung lượng pin lớn 5000mAh cùng sạc nhanh giúp máy luôn tràn đầy năng lượng. Bút S-Pen tích hợp là trợ thủ đắc lực cho ghi chú và công việc sáng tạo.',28900000.00,3,2,15),(14,'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcSx4815HRYfu8cYmronutEblGqz1RhFGRLK9deut9e5v1I8YBcbN7X5nuAhMM3n2icUXEl6-bzujMqtQcXDLP55crmGUkm2GeXOqbk6xOkJthtbnbmlM8QWtQ','Xiaomi 14 Pro','Chip Snapdragon 8 Gen 3\nCamera Leica 50MP\nMàn hình LTPO 6.7\"\nSạc nhanh 120W\nPin 4880mAh','Xiaomi 14 Pro mang đến trải nghiệm flagship với cụm camera Leica chuyên nghiệp, hỗ trợ chụp đêm, chân dung và HDR cực tốt. Chip Snapdragon 8 Gen 3 mạnh mẽ xử lý mượt mọi tác vụ. Màn hình 6.7\" LTPO 120Hz cho độ sáng và độ mượt tối ưu. Sạc nhanh 120W cho tốc độ nạp pin siêu tốc chỉ trong vài phút. Thiết kế sang trọng cùng khả năng xử lý AI thông minh khiến máy trở thành lựa chọn tuyệt vời trong phân khúc cao cấp.',19900000.00,3,3,30),(16,'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTD6u24NtqraFpEJORwy_WiFjfS99zPQkA-rbgVuBOXTNYahn7G4qqMzaef0dyvjTSkQ0gHx0E9mKe5-3hyHgGx_AlpdQK7Njp7YoIdDvYXZAbsus9S6LrF','MacBook Pro 14\" M3','Chip Apple M3\nRAM 8–16GB\nSSD 512GB\nMàn hình Liquid Retina XDR\nPin 18 giờ','MacBook Pro 14\" M3 sở hữu chip Apple Silicon M3 mới nhất, mang lại tốc độ xử lý vượt trội và hiệu năng đồ họa cải thiện mạnh mẽ. Màn hình Liquid Retina XDR 120Hz cực kỳ sắc nét với độ sáng cao, phù hợp chỉnh sửa ảnh và dựng video. Hệ thống loa spatial audio cho âm thanh sống động. Pin dùng cả ngày, thiết kế mỏng nhẹ và hệ điều hành macOS ổn định giúp MacBook trở thành thiết bị hoàn hảo cho dân sáng tạo và lập trình viên.',45900000.00,1,1,10),(17,'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcQj_s3zMjfIxtB31KEGoZEQlfWntTy5MmY4KNCxbkmC1NsKXkkZIQC0Xk-vzuAV2aIafBe4id2MoaUlGyK2KFrhJ7OucyFkcfO7z4za4vvEfU49sTeXXkbq6SHWc_l66dN4Pno5GET3bg&usqp=CAc','ASUS ROG Strix G16','CPU i7-13650HX\nGPU RTX 4060\nRAM 16GB\nSSD 512GB\nMàn hình 16\" 165Hz\nTản nhiệt buồng hơi','ROG Strix G16 là mẫu laptop gaming mạnh mẽ với CPU Intel thế hệ mới và GPU RTX 40 series. Màn hình 16\" tần số quét cao mang đến trải nghiệm thị giác mượt mà. Thiết kế đậm chất gaming với RGB và hệ thống tản nhiệt buồng hơi tiên tiến đảm bảo máy hoạt động mát mẻ trong thời gian dài. ROG Strix G16 phù hợp cho game thủ eSports, streamer và người cần hiệu năng vượt trội.',37900000.00,1,10,10),(18,'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcR53x48cNwved73-TktP5v75Wn6haKRQBmJni2j1jAeciF1XgFU5Ic-sZx4FNB5nqIBvNATGGVeumAKlIWk6LGW1N8bGY25dStHYBW1U0ndekHVYTHn6NXYQbZ3vZlt8YS9OmKINL5khQ&usqp=CAc','Lenovo IdeaPad 5 Pro','CPU Ryzen 7 5800H\nRAM 16GB\nSSD 512GB\nMàn hình 16\" 2.5K\nPin 75Wh','Lenovo IdeaPad 5 Pro là mẫu laptop mỏng nhẹ nhưng vẫn đảm bảo hiệu suất cao với CPU Ryzen mạnh mẽ và màn hình 2.5K sắc nét. Thiết kế kim loại sang trọng, thời lượng pin dài và hệ thống loa Dolby Atmos mang đến trải nghiệm giải trí chất lượng. Đây là mẫu laptop hoàn hảo cho sinh viên và nhân viên văn phòng cần một thiết bị đa năng.',19900000.00,1,14,25),(19,'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcTcGyDfE7eiBx0aKsUn2J3NWAyQU_xv0P4ReIQGjj3Do5Hy9Okx2Hwbs_jfCM70KE28f1lihVuQuV50Go4824Y8HI_TZBq8q9h_pLvmFeSsqASNgRklZO31Hg','HP Spectre x360','CPU Intel Core i7\nRAM 16GB\nSSD 1TB\nMàn hình OLED cảm ứng\nGập 360°','HP Spectre x360 sở hữu thiết kế xoay gập tinh tế với bản lề 360° cho nhiều chế độ sử dụng khác nhau. Màn hình OLED cảm ứng rực rỡ cho khả năng hiển thị xuất sắc. Hiệu năng mạnh nhờ CPU Intel mới, kết hợp SSD tốc độ cao. Máy hỗ trợ bút stylus, phù hợp cho người sáng tạo, designer và dân văn phòng cần tính linh hoạt.',32900000.00,1,13,10),(20,'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcT0zpwpaRzgfyOCDYOcYDAAnEkE7Uryi-Yv0ZAQ91c1r_jTlGtuUQVXV3svlTBS2phsuGw7AF_9ee2k1bWZwhj5vNMuWxLedz3ps8XRYJPwBabYajzTMGIU','LG UltraGear 27\" 144Hz','Kích thước 27\"\nTần số quét 144Hz\nTấm nền IPS\nPhản hồi 1ms\nHỗ trợ G-Sync/FreeSync','Màn hình LG UltraGear 27” mang đến trải nghiệm gaming tuyệt vời với tần số quét 144Hz và độ trễ thấp. Tấm nền IPS cho màu sắc trung thực, góc nhìn rộng. Tích hợp công nghệ FreeSync/G-Sync giúp giảm hiện tượng xé hình và giật lag. Thiết kế viền mỏng hiện đại, phù hợp cho cả chơi game lẫn làm việc văn phòng.',6990000.00,2,9,18),(21,'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTsGYtMFKH9y-n64SHw-ILQZQTNi2N3Z_jkvq0nvrse16dAmNAAipksKPWTCVzCXqH5qNwL7zwEPMTguve22pF3BHeBLAwUKftzrF0HLfwtmhzIu5Np0OzBW0EpoXi24IeGptD1A0jDnA&usqp=CAc','Samsung Odyssey G5 32\"','Màn hình cong 1000R\nKích thước 32\"\nĐộ phân giải QHD\nTần số quét 144Hz\nHDR10','Samsung Odyssey G5 32\" sở hữu thiết kế cong 1000R giúp tạo cảm giác đắm chìm. Màn hình QHD sắc nét, tần số quét 144Hz và HDR10 giúp hiển thị chân thật hơn. Phù hợp cho game thủ thích trải nghiệm rộng lớn và độ sâu hình ảnh cao. Thiết kế cong giúp bảo vệ mắt khi dùng lâu.',8990000.00,2,2,14),(22,'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcRoN5SvSsAo0HIqVvwHX3g1BVQKrTvzQuZ_qi72MOCheBxEv1UKcTcAoYvwr3cMPYt4sUsnBMjUYOjJ_fjbXKCXlXYPkdGONhZLRFHijOzxfycI7mUod7WV','ASUS TUF Gaming VG249Q','Kích thước 24\"\nTần số quét 144Hz\nTấm nền IPS\nFreeSync Premium\nPhản hồi 1ms','VG249Q là màn hình 24\" với tấm nền IPS chất lượng cao, tần số quét 144Hz và thời gian phản hồi 1ms. Công nghệ Adaptive Sync giúp loại bỏ hiện tượng xé hình khi chơi game. Thiết kế bền bỉ chuẩn TUF, chân đế chắc chắn và khả năng tùy chỉnh góc nghiêng linh hoạt.',4990000.00,2,10,20),(24,'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSB1JSOhSb5kiJidtfXs4twTk7vCt4dEyvnAVNhEtBsDtCfAGSWUL1RukgP0YHh2tSiVQFLH1S0jQsFBIFQdjISyzZWQSoc5HmqBfg6Zl9m_CVkJtP8CFYR','Sony WH-1000XM5','Chống ồn ANC\nÂm thanh Hi-Res\nPin 30 giờ\nBluetooth 5.2\nSạc USB-C','Sony WH-1000XM5 là mẫu tai nghe chống ồn tốt nhất hiện nay. 2 chip xử lý chống ồn cùng 8 microphone giúp loại bỏ tối đa tiếng ồn. Âm thanh Hi-Res, driver mới cho chất lượng âm thanh cân bằng. Pin lên đến 30 giờ và sạc nhanh tiện lợi. Thiết kế nhẹ nhàng, êm ái phù hợp đeo lâu.',7990000.00,4,8,30),(25,'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcT6cctNkHAaY7xBRdI4qJxE26zMJ0ZNaWAx1_jbynyVgGR40Zx6LpjXvCj9JxOSYDMjGB7RW0KF2Thfo-yNTkmtLJyad0YorQVz9jYke9eUWHXe9e3t_hF67w','AirPods Pro 2','Chip H2\nChống ồn ANC\nAdaptive Transparency\nPin 6 giờ\nSạc MagSafe/USB-C','AirPods Pro 2 mang lại trải nghiệm âm thanh vượt trội nhờ chip H2. Công nghệ chống ồn ANC cải tiến, chế độ Transparency thông minh và tính năng Adaptive Audio giúp máy tự điều chỉnh âm lượng theo môi trường. Tích hợp sâu với hệ sinh thái Apple, kết nối nhanh và ổn định.',5290000.00,4,1,28),(27,'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSP4SVw4hMg42aGpasCGCVmVWbfQ1QQjH5MgV3JlfuBXmBJyDxmaDL-L1qBSPQ17kos59MMEFRvlsCeBjmGuPpv0JG3eBJOUYN2qWKB1zkIRyPANrVgJNZaJQ','Razer BlackShark V2','Driver TriForce 50mm\nÂm thanh 7.1\nMicro chống ồn\nĐệm tai siêu nhẹ','Tai nghe gaming chuyên nghiệp với driver TriForce 50mm cho âm thanh sắc nét. Âm thanh vòm 7.1 giúp định vị chuẩn xác trong game FPS. Micro HyperClear Supercardioid loại bỏ tiếng ồn hiệu quả. Đệm tai siêu nhẹ giúp thoải mái khi chơi lâu.',2190000.00,4,16,40),(28,'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRHqgycbkORm2sm37MY06d9ovEta3vM0aIJt8BMI8oOMDwWHy0-Of3Dy7rA77ybs7FRRB72MfYm13fEhR_ztj8VNELA9TmhKfo80NWz7dOPSMM2pDal_ZDdjw','Apple Watch Series 9','Chip S9\nMàn hình Always-On\nDouble Tap\nTheo dõi sức khỏe\nKháng nước 50m','Apple Watch Series 9 nâng cấp mạnh mẽ với chip S9 giúp phản hồi nhanh hơn. Màn hình sáng hơn, hỗ trợ Double Tap mới, theo dõi sức khỏe toàn diện: nhịp tim, ECG, oxy máu, giấc ngủ. Tích hợp GPS, chống nước 50m và nhiều chế độ tập luyện.',10990000.00,5,1,10),(29,'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTxLAgXU82Gxrvpb-D4VzisoOHjxJbe4l_ThONMmqdrJwkKwQWVwwu8648naF6R-_ArkyxKmZ77gF_s8oB4ZTfEleGJyONca8NhHVGYVJT6pkkcakvZz6Xt','Logitech MX Master 3S','Cảm biến 8K DPI\nCuộn MagSpeed\nKết nối 3 thiết bị\nPin 70 ngày\nSạc USB-C','',2490000.00,5,17,20),(32,'https://cdn.tgdd.vn/Products/Images/42/342681/iphone-17-pro-max-1tb-xanh-duong-thumb-600x600.jpg','iPhone 17 Pro','Chip A19 Bionic • Màn hình 6.3\" • Camera 48MP • Pin 4500mAh','iPhone 17 Pro trang bị chip A19 Bionic mạnh mẽ, màn hình ProMotion 120Hz 6.3 inch, camera 48MP cải tiến với khả năng quay video 8K, pin 4500mAh tối ưu hoá thời lượng, thiết kế titan sang trọng và hỗ trợ sạc nhanh thế hệ mới.',34990000.00,3,1,20),(34,'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTaTI3DWM8Gji8I1hXeovp-Zi56FhoxXsxbqaZmmh-VyU4FeTeJaiHDHjUNkN5npFkKQHYCE7bop2eGCLmdrYW1O4H6skZtCc_SyKsf1zN-MC_TRco0LgobMw','LG QNED AI QNED81 4K','Màn hình QNED 4K\nCông nghệ Quantum Dot + NanoCell\nChip AI α7 Gen6 4K\nTần số quét 60Hz / 120Hz AI\nHDR10 Pro\nHệ điều hành webOS','LG QNED AI QNED81 là mẫu TV QNED 4K mới của LG, kết hợp giữa công nghệ Quantum Dot và NanoCell giúp tái tạo màu sắc sống động, độ tương phản cao và hình ảnh chân thật trong mọi điều kiện ánh sáng. Với độ phân giải 4K sắc nét cùng khả năng nâng cấp hình ảnh bằng AI, chiếc TV mang đến trải nghiệm xem phim, thể thao và nội dung HDR tuyệt vời hơn bao giờ hết.',18900000.00,2,NULL,10);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `url` varchar(500) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`,`sort_order`),
  CONSTRAINT `fk_img_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_replies`
--

DROP TABLE IF EXISTS `review_replies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_replies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `review_id` bigint unsigned NOT NULL,
  `staff_id` bigint unsigned NOT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_rr_staff` (`staff_id`),
  KEY `review_id` (`review_id`),
  CONSTRAINT `fk_rr_review` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rr_staff` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_replies`
--

LOCK TABLES `review_replies` WRITE;
/*!40000 ALTER TABLE `review_replies` DISABLE KEYS */;
/*!40000 ALTER TABLE `review_replies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `rating` int NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `body` text,
  `is_approved` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_review_user_product` (`product_id`,`user_id`),
  KEY `fk_rev_user` (`user_id`),
  KEY `product_id` (`product_id`,`is_approved`,`created_at`),
  CONSTRAINT `fk_rev_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rev_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,12,6,4,'ABC','Sản phẩm tốt',0,'2025-11-15 00:52:26'),(2,21,6,5,'abc','123',0,'2025-11-16 10:26:42'),(3,24,6,5,'ABC','XYZ\n',0,'2025-11-17 01:02:37'),(8,25,6,5,'abc','123',1,'2025-11-17 01:27:33'),(10,28,6,5,'abc','123',1,'2025-11-23 03:23:35');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (3,'admin'),(1,'customer'),(2,'staff');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `address_text` varchar(255) DEFAULT NULL,
  `avatar_url` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `fk_users_role` (`role_id`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (4,2,'testuser@example.com','Nguyen Dong','123','testuser@example.com','',NULL,1,'2025-11-05 08:33:48','2025-11-16 17:24:54','$2a$10$RhGnLefP6mxOtOGWrOc0I.yD5M0rGVjsVDA60pZESAZkueXgB.G7.'),(5,3,'dongnguyen290104@gmail.com','Tin',NULL,'dongnguyen290104@gmail.com',NULL,NULL,1,'2025-11-08 09:02:22','2025-11-08 09:26:23','$2a$10$2H61HCXx6.vFnLrrYKceSOKk.pW8NHbdIs6p8KlXfUSAE0m9gwtRm'),(6,1,'dongnguyen@gmail.com','Dong Nguyen','123123','dongnguyen@gmail.com','20 hoang hoa tham','https://i.pinimg.com/736x/f0/21/2b/f0212bac3c7446931b1fbf2fbbe49936.jpg',1,'2025-11-08 09:54:13','2025-11-23 10:22:46','$2a$10$.zSF2PKEbKjwqrY9v.ZgZ.uVSvmDTBfNozvgYJlcKQGn5GW7ZaEPm'),(7,1,'cong@gmail.com','Cong','','cong@gmail.com','',NULL,1,'2025-11-12 06:04:54','2025-11-16 17:31:15','$2a$10$HLcuQoJK0YBqxjSOt/NN0.LIOxIa.ahG.NZi8Luaokrz04ji5Jxu6'),(8,1,'huy@gmail.com','Huy',NULL,'huy@gmail.com',NULL,NULL,1,'2025-11-15 09:00:47',NULL,'$2a$10$wltQOeSpvQWUdHPjwNo.1.S4WDJbxTti461KJUOD76hfkwEoeXQ0G');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-27 15:24:58
