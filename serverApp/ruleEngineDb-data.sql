# ************************************************************
# Sequel Pro SQL dump
# Version 5446
#
# https://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 8.0.30)
# Database: ruleEngineDb
# Generation Time: 2023-09-08 08:32:39 +0000
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

LOCK TABLES `t_operator` WRITE;
/*!40000 ALTER TABLE `t_operator` DISABLE KEYS */;

INSERT INTO `t_operator` (`id`, `label`, `code`, `is_sys`, `remark`, `type`)
VALUES
	(1,'等于','eq',1,NULL,'Basic'),
	(2,'不等于','ne',1,NULL,'Basic'),
	(3,'大于','gt',1,NULL,'Basic'),
	(4,'大于或等于','gte',1,NULL,'Basic'),
	(5,'小于','lt',1,NULL,'Basic'),
	(6,'小于或等于','lte',1,NULL,'Basic'),
	(7,'区间范围','between',1,NULL,'Basic'),
	(8,'不在区间范围','notBetween',1,NULL,'Basic'),
	(9,'存在于','in',1,'单个元素存在于集合中: 前者存在于后者中','Basic'),
	(10,'不存在于','nin',1,'单个元素不存在于集合中：前者不存在于后者中','Basic'),
	(11,'包含','contains',1,'值集合包含某个元素：前者包含后者','Collection'),
	(12,'不包含','notContains',1,'值集合不包含某个元素：前者不包含后者','Collection'),
	(13,'包含全部','containsAll',1,'值集合包含所有元素：前者包含所有后者，即后者是前者子集','Collection'),
	(14,'任意一个存在于','anyIn',1,'任意元素存在于集合中，前者任意一个元素存在于后者中，即交集非空','Collection'),
	(15,'几个存在于','numberIn',1,'两个集合交集中的元素是几个','Collection'),
	(16,'至少几个存在于','gteNumberIn',1,'两个集合交集中的元素不小于几','Collection'),
	(17,'至多几个存在于','lteNumberIn',1,'两个集合交集中的元素不大于几','Collection'),
	(18,'都存在于','allIn',1,'元素全部元素存在于集合中: 前者都存在于后者中，即前者是后者子集','Collection'),
	(19,'都不存在于','allNotIn',1,'元素全部元素都不存在于集合中，前者任何一个元素都不出现于后者中，二者无交集','Collection'),
	(20,'或者','or',1,'逻辑或(OR)','Logical'),
	(21,'并且','and',1,'逻辑且(AND)','Logical'),
	(22,'均非','none',1,'逻辑都不是(All NOT)','Logical');

/*!40000 ALTER TABLE `t_operator` ENABLE KEYS */;
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

LOCK TABLES `t_param_type` WRITE;
/*!40000 ALTER TABLE `t_param_type` DISABLE KEYS */;

INSERT INTO `t_param_type` (`id`, `label`, `code`, `support_op_ids`, `is_sys`, `is_basic`)
VALUES
	(1,'字符串','String','1,2,3,4,5,6,7,8,9,10',1,1),
	(2,'整数','Int','1,2,3,4,5,6,7,8,9,10',1,1),
	(3,'长整数','Long','1,2,3,4,5,6,7,8,9,10',1,1),
	(4,'小数','Double','1,2,3,4,5,6,7,8,9,10',1,1),
	(5,'日期时间','Datetime','1,2,3,4,5,6,7,8,9,10',1,1),
	(6,'布尔','Bool','1',1,1),
	(7,'字符串集合','StringSet','11,12,13,14,15,16,17,18,19',1,0),
	(8,'整数集合','IntSet','11,12,13,14,15,16,17,18,19',1,0),
	(9,'长整数集合','LongSet','11,12,13,14,15,16,17,18,19',1,0),
	(10,'小数集合','DoubleSet','11,12,13,14,15,16,17,18,19',1,0),
	(11,'日期集合','DateTimeSet','11,12,13,14,15,16,17,18,19',1,0);

/*!40000 ALTER TABLE `t_param_type` ENABLE KEYS */;
UNLOCK TABLES;


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
