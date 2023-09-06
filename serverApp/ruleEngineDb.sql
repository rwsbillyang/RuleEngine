# ************************************************************
# Sequel Pro SQL dump
# Version 5446
#
# https://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 8.0.30)
# Database: ruleEngineDb
# Generation Time: 2023-09-06 04:12:59 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table t_constant
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_constant`;

CREATE TABLE `t_constant` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `value` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `is_enum` tinyint(1) DEFAULT NULL,
  `remark` varchar(512) DEFAULT NULL,
  `domain_id` int unsigned DEFAULT NULL,
  `type_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;



# Dump of table t_domain
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_domain`;

CREATE TABLE `t_domain` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;



# Dump of table t_expression
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_expression`;

CREATE TABLE `t_expression` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(64) NOT NULL DEFAULT '',
  `type` varchar(16) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `expr_str` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `meta_str` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `remark` varchar(512) DEFAULT NULL,
  `domain_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;



# Dump of table t_operator
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_operator`;

CREATE TABLE `t_operator` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `code` varchar(32) NOT NULL DEFAULT '',
  `is_sys` tinyint(1) DEFAULT NULL,
  `remark` varchar(512) DEFAULT NULL,
  `type` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;



# Dump of table t_param
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_param`;

CREATE TABLE `t_param` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `type_id` int unsigned NOT NULL,
  `map_key` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `remark` varchar(512) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT '',
  `domain_id` int unsigned DEFAULT NULL,
  `value_scope_ids` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;



# Dump of table t_param_type
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_param_type`;

CREATE TABLE `t_param_type` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `code` varchar(64) NOT NULL DEFAULT '',
  `support_op_ids` varchar(512) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `is_sys` tinyint(1) DEFAULT NULL,
  `is_basic` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;



# Dump of table t_rule
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_rule`;

CREATE TABLE `t_rule` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `expr_str` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `meta_str` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `expr_id` int unsigned DEFAULT NULL,
  `then_action` varchar(32) DEFAULT NULL,
  `else_action` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `priority` int DEFAULT NULL,
  `remark` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `enable` tinyint DEFAULT NULL,
  `tags` varchar(256) DEFAULT NULL,
  `domain_id` int DEFAULT NULL,
  `threshhold` int unsigned DEFAULT NULL,
  `rule_children_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `rule_group_children_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `rule_parent_ids` text,
  `rule_group_parent_ids` text,
  `level` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;



# Dump of table t_rule_action
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_rule_action`;

CREATE TABLE `t_rule_action` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `action_key` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `remark` varchar(512) DEFAULT NULL,
  `label` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;



# Dump of table t_rule_group
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_rule_group`;

CREATE TABLE `t_rule_group` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(32) DEFAULT NULL,
  `exclusive` tinyint DEFAULT NULL,
  `rule_children_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `rule_group_children_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `domain_id` int DEFAULT NULL,
  `tags` varchar(256) DEFAULT NULL,
  `remark` varchar(512) DEFAULT NULL,
  `enable` tinyint DEFAULT NULL,
  `priority` int DEFAULT NULL,
  `rule_parent_ids` text,
  `rule_group_parent_ids` text,
  `level` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
