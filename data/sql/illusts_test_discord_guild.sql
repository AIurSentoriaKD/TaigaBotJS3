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
-- Table structure for table `discord_guild`
--

DROP TABLE IF EXISTS `discord_guild`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discord_guild` (
  `id` varchar(30) COLLATE utf8mb4_bin NOT NULL,
  `pixiv_enabled` varchar(4) COLLATE utf8mb4_bin NOT NULL,
  `premium_status` varchar(4) COLLATE utf8mb4_bin NOT NULL,
  `daily_status` varchar(4) COLLATE utf8mb4_bin NOT NULL,
  `webhook_url` varchar(500) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `discord_guild_chk_1` CHECK ((`pixiv_enabled` in (_utf8mb4'on',_utf8mb4'off'))),
  CONSTRAINT `discord_guild_chk_2` CHECK ((`premium_status` in (_utf8mb4'on',_utf8mb4'off'))),
  CONSTRAINT `discord_guild_chk_3` CHECK ((`daily_status` in (_utf8mb4'on',_utf8mb4'off')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discord_guild`
--

LOCK TABLES `discord_guild` WRITE;
/*!40000 ALTER TABLE `discord_guild` DISABLE KEYS */;
INSERT INTO `discord_guild` VALUES ('212066977655554048','on','on','on','https://discordapp.com/api/webhooks/836448366333394974/PiWmippoZrTDxUo4q3JzOIp2ONwJhBOkcpaFaAIh-bF24XHaz3O0jOvzXBuhon8nDNWR'),('505981500991471617','on','on','on','https://discordapp.com/api/webhooks/908910442263506974/YO3HCzWbSK-RyCmkL_2BB88kpdnQDtlfyNXOumGFXsGY_OQERMR9hBhTlPvh-Zj2UQKv'),('646799198167105539','on','on','on','https://discordapp.com/api/webhooks/836641424656302175/lrLwXViE12Zz4tYcckT9pWYLln3m-e4rFG1AD_8nhVo3gqBJok-F80pBRedt1Fkbh8yi'),('843988150325477377','on','on','on','https://discord.com/api/webhooks/913908357495136296/hkwE2omD0fAm1tGOXdymi2MY7jTulnrTxe9GsaMoU8kPO1q7IyODLN_Hg7lijZ0RYS57');
/*!40000 ALTER TABLE `discord_guild` ENABLE KEYS */;
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
