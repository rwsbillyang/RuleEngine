# ************************************************************
# Sequel Pro SQL dump
# Version 5446
#
# https://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 8.0.30)
# Database: ruleEngineDb
# Generation Time: 2024-04-22 03:55:03 +0000
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



# Dump of table t_opcode
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_opcode`;

CREATE TABLE `t_opcode` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `code` varchar(32) NOT NULL DEFAULT '',
  `is_sys` tinyint(1) DEFAULT NULL,
  `remark` varchar(512) DEFAULT NULL,
  `type` varchar(32) DEFAULT NULL,
  `domain_id` int unsigned DEFAULT NULL,
  `operand_config_map_str` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

LOCK TABLES `t_opcode` WRITE;
/*!40000 ALTER TABLE `t_opcode` DISABLE KEYS */;

INSERT INTO `t_opcode` (`id`, `label`, `code`, `is_sys`, `remark`, `type`, `domain_id`, `operand_config_map_str`)
VALUES
	(1,'等于','eq',1,NULL,'Basic',NULL,'{\"other\":{\"label\":\"值\",\"tooltip\":\"与另一个值other比较\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(2,'不等于','ne',1,NULL,'Basic',NULL,'{\"other\":{\"label\":\"值\",\"tooltip\":\"与另一个值other比较\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(3,'大于','gt',1,NULL,'Basic',NULL,'{\"other\":{\"label\":\"值\",\"tooltip\":\"与另一个值other比较\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(4,'大于或等于','gte',1,NULL,'Basic',NULL,'{\"other\":{\"label\":\"值\",\"tooltip\":\"与另一个值other比较\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(5,'小于','lt',1,NULL,'Basic',NULL,'{\"other\":{\"label\":\"值\",\"tooltip\":\"与另一个值other比较\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(6,'小于或等于','lte',1,NULL,'Basic',NULL,'{\"other\":{\"label\":\"值\",\"tooltip\":\"与另一个值other比较\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(7,'区间范围','between',1,NULL,'Basic',NULL,'{\"start\":{\"label\":\"起始值\",\"tooltip\":\"范围比较[start, end]\",\"multiple\":false,\"required\":true,\"enable\":true},\"end\":{\"label\":\"终止值\",\"tooltip\":\"范围比较[start, end]\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(8,'不在区间范围','notBetween',1,NULL,'Basic',NULL,'{\"start\":{\"label\":\"起始值\",\"tooltip\":\"范围比较[start, end]\",\"multiple\":false,\"required\":true,\"enable\":true},\"end\":{\"label\":\"终止值\",\"tooltip\":\"范围比较[start, end]\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(9,'存在于','in',1,NULL,'Basic',NULL,'{\"set\":{\"label\":\"集合\",\"tooltip\":\"单个元素 \'存在于\' 集合set中\",\"multiple\":true,\"required\":true,\"enable\":true}}'),
	(10,'不存在于','nin',1,NULL,'Basic',NULL,'{\"set\":{\"label\":\"集合\",\"tooltip\":\"单个元素 \'不存在\' 于集合set中\",\"multiple\":true,\"required\":true,\"enable\":true}}'),
	(11,'只包含（等于）','onlyContains',1,NULL,'Collection',NULL,'{\"other\":{\"label\":\"集合\",\"tooltip\":\"集合所包含元素相同，即等于\",\"multiple\":true,\"required\":true,\"enable\":true}}'),
	(12,'包含某元素','contains',1,NULL,'Collection',NULL,'{\"e\":{\"label\":\"元素e\",\"tooltip\":\"是否包含某个元素e\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(13,'不包含某元素','notContains',1,NULL,'Collection',NULL,'{\"e\":{\"label\":\"元素e\",\"tooltip\":\"是否不包含某个元素e\",\"multiple\":false,\"required\":true,\"enable\":true}}'),
	(14,'包含全部','containsAll',1,NULL,'Collection',NULL,'{\"other\":{\"label\":\"集合\",\"tooltip\":\"集合包含所有other的元素，即other是子集\",\"multiple\":true,\"required\":true,\"enable\":true}}'),
	(15,'任意一个存在于','anyIn',1,NULL,'Collection',NULL,'{\"other\":{\"label\":\"集合\",\"tooltip\":\"任意元素存在于集合other中，任意一个元素存在于other中，即交集非空\",\"multiple\":true,\"required\":true,\"enable\":true}}'),
	(16,'有几个存在于','numberIn',1,NULL,'Collection',NULL,'{\"other\":{\"label\":\"集合\",\"tooltip\":\"有num个元素存在于集合other中\",\"multiple\":true,\"required\":true,\"enable\":true},\"num\":{\"label\":\"num\",\"tooltip\":\"两个集合交集中的元素是num个\",\"multiple\":false,\"required\":true,\"typeCode\":\"Int\",\"enable\":true}}'),
	(17,'至少几个存在于','gteNumberIn',1,NULL,'Collection',NULL,'{\"other\":{\"label\":\"集合\",\"tooltip\":\"有num个元素存在于集合other中\",\"multiple\":true,\"required\":true,\"enable\":true},\"num\":{\"label\":\"num\",\"tooltip\":\"两个集合交集中的元素不小于num个\",\"multiple\":false,\"required\":true,\"typeCode\":\"Int\",\"enable\":true}}'),
	(18,'至多几个存在于','lteNumberIn',1,NULL,'Collection',NULL,'{\"other\":{\"label\":\"集合\",\"tooltip\":\"有num个元素存在于集合other中\",\"multiple\":true,\"required\":true,\"enable\":true},\"num\":{\"label\":\"num\",\"tooltip\":\"两个集合交集中的元素不大于num个\",\"multiple\":false,\"required\":true,\"typeCode\":\"Int\",\"enable\":true}}'),
	(19,'都存在于','allIn',1,NULL,'Collection',NULL,'{\"other\":{\"label\":\"集合\",\"tooltip\":\"元素全部元素存在于集合other中, 是other的子集\",\"multiple\":true,\"required\":true,\"enable\":true}}'),
	(20,'都不存在于','allNotIn',1,NULL,'Collection',NULL,'{\"other\":{\"label\":\"集合\",\"tooltip\":\"元素全部元素都不存在于集合other中，二者无交集\",\"multiple\":true,\"required\":true,\"enable\":true}}'),
	(21,'或者','or',1,'逻辑或(OR)','Logical',NULL,NULL),
	(22,'并且','and',1,'逻辑且(AND)','Logical',NULL,NULL),
	(23,'均非','none',1,'逻辑都不是(All NOT)','Logical',NULL,NULL);

/*!40000 ALTER TABLE `t_opcode` ENABLE KEYS */;
UNLOCK TABLES;


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
  `category_id` int unsigned DEFAULT NULL,
  `extra` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;



# Dump of table t_param_category
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_param_category`;

CREATE TABLE `t_param_category` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(32) DEFAULT NULL,
  `domain_id` int unsigned DEFAULT NULL,
  `extra` varchar(32) DEFAULT NULL,
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
  `type` varchar(32) DEFAULT NULL,
  `domain_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

LOCK TABLES `t_param_type` WRITE;
/*!40000 ALTER TABLE `t_param_type` DISABLE KEYS */;

INSERT INTO `t_param_type` (`id`, `label`, `code`, `support_op_ids`, `is_sys`, `type`, `domain_id`)
VALUES
	(1,'字符串','String','1,2,3,4,5,6,7,8,9,10',1,'Basic',NULL),
	(2,'整数','Int','1,2,3,4,5,6,7,8,9,10',1,'Basic',NULL),
	(3,'长整数','Long','1,2,3,4,5,6,7,8,9,10',1,'Basic',NULL),
	(4,'小数','Double','1,2,3,4,5,6,7,8,9,10',1,'Basic',NULL),
	(5,'日期时间','DateTime','1,2,3,4,5,6,7,8,9,10',1,'Basic',NULL),
	(6,'布尔','Bool','1',1,'Basic',NULL),
	(7,'字符串集合','StringSet','11,12,13,14,15,16,17,18,19,20',1,'Collection',NULL),
	(8,'整数集合','IntSet','11,12,13,14,15,16,17,18,19,20',1,'Collection',NULL),
	(9,'长整数集合','LongSet','11,12,13,14,15,16,17,18,19,20',1,'Collection',NULL),
	(10,'小数集合','DoubleSet','11,12,13,14,15,16,17,18,19,20',1,'Collection',NULL),
	(11,'日期集合','DateTimeSet','11,12,13,14,15,16,17,18,19,20',1,'Collection',NULL);

/*!40000 ALTER TABLE `t_param_type` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table t_rule
# ------------------------------------------------------------

DROP TABLE IF EXISTS `t_rule`;

CREATE TABLE `t_rule` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(256) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `rule_parent_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `rule_group_parent_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `rule_children_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `rule_group_children_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `description` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `remark` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `expr_remark` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `expr_str` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `meta_str` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `priority` int NOT NULL,
  `tags` varchar(256) DEFAULT NULL,
  `domain_id` int DEFAULT NULL,
  `level` int NOT NULL,
  `exclusive` tinyint NOT NULL,
  `enable` tinyint NOT NULL,
  `threshhold` int unsigned DEFAULT NULL,
  `then_action` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `else_action` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
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
  `label` varchar(32) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '',
  `exclusive` tinyint NOT NULL,
  `rule_parent_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `rule_group_parent_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `rule_children_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `rule_group_children_ids` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci,
  `domain_id` int DEFAULT NULL,
  `tags` varchar(256) DEFAULT NULL,
  `remark` varchar(512) DEFAULT NULL,
  `enable` tinyint NOT NULL,
  `priority` int NOT NULL,
  `level` int NOT NULL,
  `expr_str` text,
  `expr_remark` text,
  `meta_str` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
