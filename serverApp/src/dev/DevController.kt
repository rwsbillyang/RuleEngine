/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-10-09 17:56
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


import com.github.rwsbillyang.ktorKit.ApiJson
import com.github.rwsbillyang.ktorKit.apiBox.Sort
import com.github.rwsbillyang.ktorKit.apiBox.UmiPagination
import com.github.rwsbillyang.ktorKit.db.AbstractSqlService
import com.github.rwsbillyang.ktorKit.db.SqlLiteHelper
import com.github.rwsbillyang.rule.composer.*
import com.github.rwsbillyang.rule.runtime.*
import com.github.rwsbillyang.yinyang.core.Gan
import com.github.rwsbillyang.yinyang.core.Gender
import com.github.rwsbillyang.yinyang.core.Zhi
import com.github.rwsbillyang.yinyang.ziwei.GongStars
import com.github.rwsbillyang.yinyang.ziwei.ZwConstants
import com.github.rwsbillyang.yinyang.ziwei.ZwPanData
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongOpEnum
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongType
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarOpEnum
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarType
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import org.komapper.core.dsl.Meta
import org.komapper.core.dsl.QueryDsl
import java.lang.System.exit

class DevController(val service: AbstractSqlService){
    /**
     * 清空类型和操作符表，并从id=1开始添加
     * */
    fun initDictDataInDb(): String {
        //bugfix： truncate table `t_param_type`;  truncate table `t_opcode`;
        service.db.runQuery{
            QueryDsl.executeScript("truncate table `t_param_type`;");
            QueryDsl.executeScript("truncate table `t_opcode`;");
        }

        val map = mutableMapOf<String, Opcode>()
        //将系统内置支持的操作符写入数据库，并构建map
        EnumBasicOp.values().forEach {
            if(map[it.name] == null){
                map[it.name] = service.save(Meta.opcode,  Opcode(it.label, it.name, Opcode.Basic, MySerializeJson.encodeToString(it.operandMap)), true)
            }
        }

        EnumCollectionOp.values().forEach {
            if(map[it.name] == null){
                map[it.name] = service.save(Meta.opcode,  Opcode(it.label, it.name, Opcode.Collection, MySerializeJson.encodeToString(it.operandMap)), true)
            }
        }

        EnumLogicalOp.values().forEach {
            if(map[it.name] == null){
                map[it.name] = service.save(Meta.opcode, Opcode(it.label, it.name,  Opcode.Logical, remark = it.remark), true)
            }
        }

        //构建内置数据类型并插入库
        val list = listOf(
            ParamType(StringType.label,StringType.code,StringType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Basic),
            ParamType(IntType.label,IntType.code,IntType.supportOperators().mapNotNull { map[it]?.id}.joinToString(","),
                ParamType.Basic
            ),
            ParamType(LongType.label,LongType.code,LongType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Basic),
            ParamType(DoubleType.label,DoubleType.code,DoubleType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Basic),
            ParamType(DateTimeType.label, DateTimeType.code, DateTimeType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Basic),
            ParamType(BoolType.label, BoolType.code, BoolType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Basic),
            ParamType(StringSetType.label, StringSetType.code, StringSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Collection),
            ParamType(IntSetType.label, IntSetType.code, IntSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Collection),
            ParamType(LongSetType.label, LongSetType.code, LongSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Collection),
            ParamType(DoubleSetType.label, DoubleSetType.code, DoubleSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Collection),
            ParamType(DateTimeSetType.label, DateTimeSetType.code, DateTimeSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Collection),
        )
        val types = service.batchSave(Meta.paramType, list, true)

        val opsJson = ApiJson.serverSerializeJson.encodeToString(map)
        val typesJson = ApiJson.serverSerializeJson.encodeToString(types)
        return "opsJson=$opsJson, typesJson=$typesJson"
    }


    /**
     * 添加rule runtime extension: Opcode + ParamType
     * */
    fun upsertZwRRtExt(): String{
        val domainId = 1

        val map = mutableMapOf<String, Opcode>()
        //将系统内置支持的操作符写入数据库，并构建map
        StarOpEnum.values().forEach {
            if(map[it.name] == null){
                val old = service.findOne(Meta.opcode, {Meta.opcode.code eq it.name})
                try {
                    val operandMap = if(old?.operandConfigMapStr != null){
                        val oldOperandCfgMap:Map<String, OperandConfig> = MySerializeJson.decodeFromString(old.operandConfigMapStr)
                        mergeOperandCfgConstantIdsToNew(oldOperandCfgMap, it.operandMap.toMutableMap())
                    } else it.operandMap
                    map[it.name] = service.save(Meta.opcode, Opcode(it.label, it.name, Opcode.Ext,
                        MySerializeJson.encodeToString(operandMap),false, domainId, it.remark, old?.id),
                        old == null)
                }catch (e: Exception){
                    System.err.println("old="+old)
                    return "Error: " + old
                }
            }
        }

        GongOpEnum.values().forEach {
            if(map[it.name] == null){
                val old = service.findOne(Meta.opcode, {Meta.opcode.code eq it.name})
                try {
                    val operandMap = if(old?.operandConfigMapStr != null){
                        val oldOperandCfgMap:Map<String, OperandConfig> = MySerializeJson.decodeFromString(old.operandConfigMapStr)
                        mergeOperandCfgConstantIdsToNew(oldOperandCfgMap, it.operandMap.toMutableMap())
                    } else it.operandMap
                    map[it.name] = service.save(Meta.opcode, Opcode(it.label, it.name, Opcode.Ext,
                        MySerializeJson.encodeToString(operandMap),false, domainId, it.remark, old?.id),
                        old == null)
                }catch (e: Exception){
                    System.err.println("old="+old)
                    return "Error: " + old
                }
            }
        }

        //构建内置数据类型并插入库
        val list = listOf(
            ParamType(
                StarType.label,
                StarType.code,
                StarType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","),
                ParamType.Ext, false, domainId, findTypeByCode(StarType.code)),
            ParamType(
                GongType.label,
                GongType.code,
                GongType.supportOperators().mapNotNull { map[it]?.id}.joinToString(","),
                ParamType.Ext, false, domainId,findTypeByCode(GongType.code)),
        )
        list.forEach {
            service.save(Meta.paramType, it, it.id == null)
        }
        //val types = service.batchSave(Meta.paramType, list, true)
        //println("types= ${MySerializeJson.encodeToString(types)}" )
        println("upsert zw rrt ext done" )
        return "Done"
    }

    /**
     * 将操作数中已配置好的值域设置到新的配置里
     * */
    private fun mergeOperandCfgConstantIdsToNew(oldOperandCfgMap: Map<String, OperandConfig>, newOperandCfgMap: MutableMap<String, OperandConfig>): Map<String, OperandConfig>{
        oldOperandCfgMap.forEach{k,v ->
            if(!v.contantIds.isNullOrEmpty()){
                val e = newOperandCfgMap[k]
                if(e != null){
                    newOperandCfgMap[k] = OperandConfig(e.label, e.tooltip, e.multiple, e.required, e.typeCode,
                        v.contantIds, e.selectOptions, e.defaultSelect,e.defaultOperandValueType,e.enable)
                }
            }
        }
        return newOperandCfgMap
    }


    private inline fun findTypeByCode(code: String) =
        service.findOne(Meta.paramType,{ Meta.paramType.code eq code})?.id



    fun insertConstants(){
        val domainId = 1

        val intypeId = findTypeByCode(IType.Type_Int)?:-1
        val gan = Constant("天干", intypeId, MySerializeJson.encodeToString(IntEnumValue(Gan.nameList.mapIndexed{ i, v -> SelectOption(v, i) })), true)
        val zhi = Constant("地支", intypeId, MySerializeJson.encodeToString(IntEnumValue(Zhi.nameList.mapIndexed{ i, v -> SelectOption(v, i) })), true)
        val gender = Constant("性别", intypeId, MySerializeJson.encodeToString(Gender.values().map{ SelectOption(it.label, it.ordinal) }), true)
        val bright = Constant("亮暗", intypeId, MySerializeJson.encodeToString(ZwConstants.Brightness.forEach { t, u -> SelectOption(u, t) }), true, domainId = domainId)

        val ret1 = service.batchSave(Meta.constant, listOf(gan, zhi, gender, bright), true)
        println("ret1= ${MySerializeJson.encodeToString(ret1)}" )

        val stringSetTypeId = findTypeByCode(IType.Type_StringSet)?:-1
        val list = mapOf(
            "十二宫" to Pair(ZwConstants.twelveGongName.toSet(), "逆时针"),
            "正曜" to Pair(ZwConstants.Zheng14Stars, null),
            "辅佐曜" to Pair(ZwConstants.FuZuoStars, null),
            "四煞" to Pair(ZwConstants.ShaStars, ""),
            "空劫" to Pair(ZwConstants.KongJieStars, null),
            "化曜" to Pair(ZwConstants.FourHua, null),
            "杂曜" to Pair(ZwConstants.ZaStars, null),
            "空曜" to Pair(ZwConstants.KongStars, "指空劫与天空。截空、旬空亦可算作空曜，但力量较弱"),
            "刑曜" to Pair(ZwConstants.XingStars, null),
            "忌曜" to Pair(ZwConstants.JiStars, null),
            "桃花诸曜" to Pair(ZwConstants.TaoHuaStars, "廉贞贪狼虽有性质"),
            "文曜" to Pair(ZwConstants.WenStars, null),
            "科名诸曜" to Pair(ZwConstants.KeMingStars, "文曜加上三台八座,恩光天贵, 台辅封诰,天官天福八曜"),
            "博士12神" to Pair(ZwConstants.BoShi12Stars, null),
            "长生12神" to Pair(ZwConstants.ZhangSheng12Stars, null),
            "岁前12星" to Pair(ZwConstants.SuiQian12Stars, null),
            "将前12星" to Pair(ZwConstants.JiangQian12Stars, null),
        ).map {
            Constant(it.key, stringSetTypeId,
                MySerializeJson.encodeToString(StringSetValue(it.value.first)), remark = it.value.second, domainId = domainId)
        }

        val ret2 = service.batchSave(Meta.constant, list, true)
        println("ret2= ${MySerializeJson.encodeToString(ret2)}" )
    }



    fun exportAsCsvFile(){
        //SELECT id,label,rule_parent_ids,rule_group_parent_ids,rule_children_ids,rule_group_children_ids,description,remark,expr_remark,expr_str,priority,tags,domain_id,level,exclusive,threshhold FROM t_rule where domain_id=1 and enable=1;
        //SELECT id,label,rule_parent_ids,rule_group_parent_ids,rule_children_ids,rule_group_children_ids,description,remark,expr_remark,expr_str,priority,tags,domain_id,level,exclusive,threshhold INTO OUTFILE '~/dev/dbDataBackup/rule.csv' FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n' FROM t_rule where domain_id=1 and enable=1;
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
                "enable" to it.enable
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
            	"priority"	INTEGER,
            	"tags"	TEXT,
            	"domain_id"	INTEGER,
            	"level"	INTEGER,
            	"exclusive"	INTEGER,
            	"enable"	INTEGER,
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
              `exclusive` INTEGER,
              `rule_parent_ids` text TEXT,
              `rule_group_parent_ids` TEXT,
              `rule_children_ids` TEXT,
              `rule_group_children_ids` TEXT,
              `domain_id` INTEGER,
              `tags` TEXT,
              `remark` TEXT,
              `enable` INTEGER,
              `priority` INTEGER,
              `level` INTEGER
            )
        """.trimIndent()
        sqlLiteHelper.createTable(sql)
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

        println("Done!")
    }
}
