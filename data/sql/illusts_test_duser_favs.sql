-- MySQL dump 10.13  Distrib 8.0.27, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: illusts_test
-- ------------------------------------------------------
-- Server version	8.0.27

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
-- Table structure for table `duser_favs`
--

DROP TABLE IF EXISTS `duser_favs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `duser_favs` (
  `illust_id` varchar(11) COLLATE utf8mb4_bin NOT NULL,
  `duser_id` varchar(20) COLLATE utf8mb4_bin NOT NULL,
  KEY `illust_id` (`illust_id`),
  KEY `duser_id` (`duser_id`),
  CONSTRAINT `duser_favs_ibfk_1` FOREIGN KEY (`illust_id`) REFERENCES `illusts` (`id`),
  CONSTRAINT `duser_favs_ibfk_2` FOREIGN KEY (`duser_id`) REFERENCES `discord_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `duser_favs`
--

LOCK TABLES `duser_favs` WRITE;
/*!40000 ALTER TABLE `duser_favs` DISABLE KEYS */;
INSERT INTO `duser_favs` VALUES ('94691838','208678337646690307'),('94743787','539302272534839296'),('94743787','245989710508457986'),('94892691','208678337646690307'),('94892691','539302272534839296'),('94895199','539302272534839296'),('94895199','208678337646690307'),('94906715','539302272534839296'),('94906715','208678337646690307'),('94932708','539302272534839296'),('94932708','208678337646690307'),('94932903','208678337646690307'),('96138689','208678337646690307'),('96138772','208678337646690307');
/*!40000 ALTER TABLE `duser_favs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-02-13 16:28:49