/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-11-21 13:14
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.github.rwsbillyang.rule.composer.dev

import com.github.rwsbillyang.ktorKit.apiBox.Sort
import com.github.rwsbillyang.ktorKit.apiBox.UmiPagination
import com.github.rwsbillyang.ktorKit.db.AbstractSqlService
import com.github.rwsbillyang.ktorKit.db.SqlLiteHelper
import com.github.rwsbillyang.rule.composer.*
import com.github.rwsbillyang.yinyang.core.Gender
import com.github.rwsbillyang.yinyang.ziwei.ZwPanData
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongType
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarType
import kotlinx.serialization.encodeToString
import org.komapper.core.dsl.Meta
import java.time.LocalDateTime


fun main(){
    val service = MyBaseCrudService()

    val sqlLiteHelper = SqlLiteHelper(HelpBooksController.sqliteDb)
    RuleMigrateController(service).apply {
        createRuleTable(sqlLiteHelper)
        migrateRuleIntoSqlLite(sqlLiteHelper)

        createGroupTable(sqlLiteHelper)
        migrateGroupIntoSqlLite(sqlLiteHelper)
    }
    sqlLiteHelper.close()

//    RuleMigrateController(service).apply {
//        runRuleExprCheck(596)
//    }
}
/**
 * 将docker中的MySQL8中的Rule和RuleGroup，迁移到MingLi app的assets中的sqlite app.db中
 * */
class RuleMigrateController(val service: AbstractSqlService) {

    fun dropCreateTableAndMigrate(): String{
        val sqlLiteHelper = SqlLiteHelper(HelpBooksController.sqliteDb)
        RuleMigrateController(service).apply {
            createRuleTable(sqlLiteHelper)
            migrateRuleIntoSqlLite(sqlLiteHelper)

            createGroupTable(sqlLiteHelper)
            migrateGroupIntoSqlLite(sqlLiteHelper)
        }
        sqlLiteHelper.close()

        return "Done"
    }

    //将Rule和RuleGroup数据更新到sqlite
    fun migrateRuleIntoSqlLite(sqlLiteHelper: SqlLiteHelper, lastId: Int? = null){
        val p = RuleQueryParams(MySerializeJson.encodeToString(UmiPagination(sort = Sort.ASC, pageSize = 100, lastId = lastId?.toString())), domainId = 1)
        val list = service.findPage(Meta.rule, p.toSqlPagination())
        list.forEach {
            val map = mapOf<String, Any?>(
                "id" to it.id,
                "label" to it.label,
                "rule_children_ids" to it.ruleChildrenIds,
                "rule_group_children_ids" to it.ruleGroupChildrenIds,
                "rule_parent_ids" to it.ruleParentIds,
                "rule_group_parent_ids" to it.ruleGroupParentIds,
                "description" to it.description,
                "remark" to it.remark,
                "expr_remark" to it.exprRemark,
                "expr_str"	to it.exprStr,
                "priority" to it.priority,
                "tags" to it.tags,
                "domain_id" to it.domainId,
                "level" to it.level,
                "exclusive" to it.exclusive,
                "enable" to it.enable,
                "threshhold" to it.threshhold
            )
            sqlLiteHelper.insert("Rule", map)
        }
        if (list.size >= p.pagination.pageSize){
            migrateRuleIntoSqlLite(sqlLiteHelper,list[list.size - 1].id)
        }
    }

    fun migrateGroupIntoSqlLite(sqlLiteHelper: SqlLiteHelper, lastId: Int? = null){
        val p = RuleGroupQueryParams(MySerializeJson.encodeToString(UmiPagination(sort = Sort.ASC, lastId = lastId?.toString())),domainId = 1)
        val list = service.findPage(Meta.ruleGroup, p.toSqlPagination())
        list.forEach {
            val map = mapOf<String, Any?>(
                "id" to it.id,
                "label" to it.label,
                "exclusive" to it.exclusive,
                "rule_children_ids" to it.ruleChildrenIds,
                "rule_group_children_ids" to it.ruleGroupChildrenIds,
                "rule_parent_ids" to it.ruleParentIds,
                "rule_group_parent_ids" to it.ruleGroupParentIds,
                "tags" to it.tags,
                "domain_id" to it.domainId,
                "remark" to it.remark,
                "priority" to it.priority,
                "level" to it.level,
                "enable" to it.enable,
                "expr_str" to it.exprStr,
                "expr_remark" to it.exprRemark
            )
            sqlLiteHelper.insert("RuleGroup", map)
        }
        if (list.size >= p.pagination.pageSize){
            migrateGroupIntoSqlLite(sqlLiteHelper,list[list.size - 1].id)
        }
    }

    fun createRuleTable(sqlLiteHelper: SqlLiteHelper, deleteTableBeforeCreate: Boolean = true){
        if(deleteTableBeforeCreate){
            sqlLiteHelper.dropTable("Rule")
        }
        val sql = """
            CREATE TABLE "Rule" (
            	"id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
            	"label"	TEXT NOT NULL,
            	"rule_parent_ids"	TEXT,
            	"rule_group_parent_ids"	TEXT,
            	"rule_children_ids"	TEXT,
            	"rule_group_children_ids"	TEXT,
            	"description"	TEXT,
            	"remark"	TEXT,
            	"expr_remark"	TEXT,
            	"expr_str"	TEXT NOT NULL,
            	"priority"	INTEGER NOT NULL,
            	"tags"	TEXT,
            	"domain_id"	INTEGER,
            	"level"	INTEGER,
            	"exclusive"	INTEGER NOT NULL,
            	"enable"	INTEGER NOT NULL,
            	"threshhold"	INTEGER
            ); 
        """.trimIndent()
        sqlLiteHelper.createTable(sql)
    }
    fun createGroupTable(sqlLiteHelper: SqlLiteHelper, deleteTableBeforeCreate: Boolean = true){
        if(deleteTableBeforeCreate){
            sqlLiteHelper.dropTable("RuleGroup")
        }
        val sql = """
            CREATE TABLE `RuleGroup` (
              `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
              `label` TEXT NOT NULL,
              `exclusive` INTEGER NOT NULL,
              `rule_parent_ids` text TEXT,
              `rule_group_parent_ids` TEXT,
              `rule_children_ids` TEXT,
              `rule_group_children_ids` TEXT,
              `domain_id` INTEGER,
              `tags` TEXT,
              `remark` TEXT,
              `enable` INTEGER NOT NULL,
              `priority` INTEGER NOT NULL,
              `level` INTEGER,
              `expr_str` TEXT,
              `expr_remark` TEXT
            )
        """.trimIndent()
        sqlLiteHelper.createTable(sql)
    }




    //test 太微赋 valid
    fun testExprDeserialize(service: MyBaseCrudService){
        service.findAll(Meta.ruleGroup, {Meta.ruleGroup.label eq "太微赋"}
            //{Meta.ruleGroup.level eq 0}
        ).forEach {
            val list = it.ruleChildrenIds?.split(",")
            if(!list.isNullOrEmpty()){
                service.findAll(Meta.rule, {Meta.rule.id inList list.map{it.toInt()} }).forEach {
                    try {
                        it.getExpr()
                    }catch (e: Exception){
                        System.err.println("it.getExpr() Exception=${e.message}, it.id=${it.id}")
                    }
                }
            }
        }

    }


    fun runRuleExprCheck(lastId: Int? = null): String{
        val zwPanData = ZwPanData.fromLocalDateTime(
            Gender.Female,
            LocalDateTime.now())

        val gongStars = zwPanData.getGongStarsByName("命宫")

        val dataProvider: (key: String, keyExtra: String?) -> Any? = { key, keyExtra ->
            when (key) {
                "zwPanData" -> zwPanData
                "currentGong" -> gongStars
                "shenGong" -> zwPanData.getGongStarsByZhi(zwPanData.shenGong)
                "yearGan" -> zwPanData.fourZhu.year.gan
                "yearZhi" -> zwPanData.fourZhu.year.zhi
                "gender" -> zwPanData.gender.ordinal
                else -> {
                    when (keyExtra) {
                        GongType.classDiscriminator -> zwPanData.getGongStarsByName(key)
                        StarType.classDiscriminator -> key
                        else -> {
                            System.err.println("dataProvider: key=$key, keyExtra=$keyExtra")
                            null
                           // throw Exception("Not found key in dataProvider: key=$key, keyExtra=$keyExtra")
                        }
                    }
                }
            }
        }
        val errList: MutableList<Pair<Int?, String?>> = mutableListOf()
        checkRuleExprValid(dataProvider, errList, lastId)
        errList.forEach {
            println("id= " + it.first + ": " + it.second)
        }
        println("select id,priority,label,description,expr_str,meta_str from t_rule where id in (" + errList.joinToString(",") { it.first.toString() } + ");")

        return "Done"
    }
    fun checkRuleExprValid(dataProvider: (key: String, keyExtra:String?) -> Any?, errList: MutableList<Pair<Int?, String?>>, lastId: Int? = null){
        val p = RuleQueryParams(MySerializeJson.encodeToString(UmiPagination(sort = Sort.ASC, pageSize = 100, lastId = lastId?.toString())), domainId = 1)
        val list = service.findPage(Meta.rule, p.toSqlPagination())
        list.forEach {
            try {
                it.getExpr().eval(dataProvider)
            }catch (e: Exception){
                errList.add(Pair(it.id, e.message))
                e.printStackTrace()
            }
        }
        if (list.size >= p.pagination.pageSize){
            checkRuleExprValid(dataProvider,errList, list[list.size - 1].id)
        }

       // println("Done!")
    }

    fun modifyRuleFileds(): Int{
       // val service = MyBaseCrudService2()

        val list = service.findAll(Meta.rule, { Meta.rule.id greaterEq 1111844})
        list.forEach {
            val desc = it.description
            val exprRemark = it.exprRemark
            val label = it.label
            service.updateValues(Meta.rule, {
                Meta.rule.label eq desc
                Meta.rule.exprRemark eq label
                Meta.rule.description eq exprRemark
            }, {Meta.rule.id eq it.id})
        }
        return list.size
    }
//    fun exportAsCsvFile(){
//        //SELECT id,label,rule_parent_ids,rule_group_parent_ids,rule_children_ids,rule_group_children_ids,description,remark,expr_remark,expr_str,priority,tags,domain_id,level,exclusive,threshhold FROM t_rule where domain_id=1 and enable=1;
//        //SELECT id,label,rule_parent_ids,rule_group_parent_ids,rule_children_ids,rule_group_children_ids,description,remark,expr_remark,expr_str,priority,tags,domain_id,level,exclusive,threshhold INTO OUTFILE '~/dev/dbDataBackup/rule.csv' FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n' FROM t_rule where domain_id=1 and enable=1;
//    }
}