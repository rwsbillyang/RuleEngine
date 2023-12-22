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



import com.github.rwsbillyang.ktorKit.cache.VoidCache
import com.github.rwsbillyang.ktorKit.db.AbstractSqlService
import com.github.rwsbillyang.ktorKit.db.SqlDataSource
import com.github.rwsbillyang.ktorKit.db.SqlLiteHelper
import com.github.rwsbillyang.rule.composer.*
import com.github.rwsbillyang.rule.runtime.*
import com.github.rwsbillyang.yinyang.core.Gender
import com.github.rwsbillyang.yinyang.ziwei.ZwConstants
import com.github.rwsbillyang.yinyang.ziwei.ZwPanData
import com.github.rwsbillyang.yinyang.ziwei.rrt.*
import kotlinx.serialization.encodeToString


import org.komapper.core.dsl.Meta
import java.time.LocalDateTime

class MyData(val key:String, val id: Int?, val label: String?, val desc: String?, val remark: String?, val exprRemark: String?)
class MyBaseCrudService(): AbstractSqlService(VoidCache()){
    override val dbSource: SqlDataSource
        get() = SqlDataSource("ruleEngineDb", "127.0.0.1", 3306, "root", "123456")
}

//若需在IDE中运行测试，需将依赖com.github.rwsbillyang:yinyang从 compileOnly 改为：implementationg
fun main(){
    val service = MyBaseCrudService()
    //val rootList = service.findAll(Meta.ruleGroup, {Meta.ruleGroup.label eq "太微赋"}) //{Meta.ruleGroup.level eq 0}
    val rootList = service.findAll(Meta.rule, {Meta.rule.id eq 716})
    runRuleEval(service, 0,
        LocalDateTime.of(1979,12,8,10,0),
        //LocalDateTime.now(),
        rootList) //0 命宫， 1 父母宫 2 福德宫...

   // generateIds()

  //  testSerialize() //sealed class 不能🈶多个层次的继承

 //   val sqlLiteHelper = SqlLiteHelper("/Users/bill/git/MingLi/app/src/main/assets/app.db")
  //  testSqlLiteFind(sqlLiteHelper)
 //   sqlLiteHelper.close()
}

fun extra2RuleCommon(extra: Any?): RuleCommon?{
    if(extra == null) return null
    return when (extra) {
        is Rule -> extra.toRuleCommon(null)
        is RuleGroup -> extra.toRuleCommon(null)
        else -> {
            System.err.println("extra2RuleCommon: extra is not Rule/RuleGroup")
            null
        }
    }
}

fun runRuleEval(service: MyBaseCrudService, gongNameIndex: Int, dateTime: LocalDateTime, rootList: List<Any>){

    val zwPanData = ZwPanData.fromLocalDateTime(
        Gender.Female,
        dateTime)

    val gongStars = zwPanData.getGongStarsByName(ZwConstants.twelveGongName[gongNameIndex])
    println("====check gongStars: ${gongStars.name}======")

    val dataPicker: (key: String, keyExtra: String?) -> Any? = {it, keyExtra->
        if(it.startsWith("pos|")){
            val arry = it.split("|").map{it.trim()}
            if(arry.size < 2){
                System.err.println("key error, no star after pos, key=$it")
                null
            }else
                zwPanData.starPosMap[arry[1]]
        }else{
            when(it){
                "zwPanData" -> zwPanData
                "gender" -> zwPanData.gender.ordinal
                "gongName" -> gongStars.name
                "zhengYao" -> gongStars.zheng14Stars?.toSet()
                "gongZhi" -> gongStars.zhi
                else -> {
                    System.err.println("not support key=$it, please check")
                    null
                }
            }
        }
    }
    val dataProvider: (key: String, keyExtra: String?) -> Any? = {key, keyExtra->
        when(key){
            "zwPanData" -> zwPanData
            "currentGong" -> gongStars
            "shenGong" -> zwPanData.getGongStarsByZhi(zwPanData.shenGong)
            "yearGan" -> zwPanData.fourZhu.year.gan
            "yearZhi" -> zwPanData.fourZhu.year.zhi
            "gender" -> zwPanData.gender.ordinal
            else -> {
                when(keyExtra){
                    GongType.classDiscriminator -> zwPanData.getGongStarsByName(key)
                    StarType.classDiscriminator -> key
                    else -> {
                        System.err.println("dataProvider: key=$key, keyExtra=$keyExtra, return key")
                        key
                    }
                }
            }
        }
    }

    val loadChildrenFunc: (parent: Any?) -> List<Any>? = {
        if(it == null) null
        else when (it) {
            is Rule -> {
                val list = mutableListOf<Any>()
                if(it.ruleChildrenIds != null){
                    val list1 = service.findAll(Meta.rule, {Meta.rule.id inList it.ruleChildrenIds.split(",").map{it.toInt()} })
                    list.addAll(list1)
                    //println("load Rule children size=${list1.size} for Rule=${it.label},id=${it.id}")
                }

                if(it.ruleGroupChildrenIds != null){
                    val list2 = service.findAll(Meta.ruleGroup, {Meta.ruleGroup.id inList it.ruleGroupChildrenIds.split(",").map{it.toInt()} })
                    list.addAll(list2)
                    //println("load RuleGroup children size=${list2.size} for Rule=${it.label},id=${it.id}")
                }

                list
            }

            is RuleGroup -> {
                val list = mutableListOf<Any>()
                if(it.ruleChildrenIds != null){
                    val list1 = service.findAll(Meta.rule, {Meta.rule.id inList it.ruleChildrenIds.split(",").map{it.toInt()} })
                    list.addAll(list1)
                    //println("load Rule children size=${list1.size} for RuleGroup=${it.label},id=${it.id}")
                }

                if(it.ruleGroupChildrenIds != null){
                    val list2 = service.findAll(Meta.ruleGroup, {Meta.ruleGroup.id inList it.ruleGroupChildrenIds.split(",").map{it.toInt()} })
                    list.addAll(list2)
                    //println("load RuleGroup children size=${list2.size} for RuleGroup=${it.label},id=${it.id}")
                }

                list
            }

            else -> {
                System.err.println("loadChildrenFunc: extra is not Rule or RuleGroup")
                null
            }
        }
    }

    val toEvalRule: (extra: Any) -> EvalRule = {
        when (it) {
            is Rule ->{
                val rule = it
                try {
                    EvalRule(it.getExpr(), it.exclusive == 1, it.thenAction, it.elseAction, it)//{ "${rule.id}: ${rule.description}"}
                }catch (e: Exception){
                    println("Exception=${e.message}, it.id=${it.id}")
                    throw e
                }
            }
            is RuleGroup -> {
                val group = it
                EvalRule(null, it.exclusive == 1, null, null, it)//{ "group-${group.id}: ${group.label}"}
            }
            else -> {
                System.err.println("toEvalRule: only support Rule/RuleGroup as extra for EvalRule： ${it.toString()}")
                throw Exception("only support Rule/RuleGroup as extra")
            }
        }
    }

//    RuleEngine.defaultAction = {currentRule, parentRule ->
//        val parent = extra2RuleCommon(parentRule?.extra)
//        val current = extra2RuleCommon(currentRule.extra)
//        println("collect ${current?.typedId}: ${current?.label},  parent: ${parent?.typedId}, ${parent?.label}")
//    }
//
//    RuleEngine.defaultElseAction = {currentRule, parentRule ->
//        val parent = extra2RuleCommon(parentRule?.extra)
//        val current = extra2RuleCommon(currentRule.extra)
//        println("not match ${current?.typedId}: ${current?.label},  parent: ${parent?.typedId}, ${parent?.label}")
//    }

    val collector = ResultTreeCollector{
        val ruleCommon = extra2RuleCommon(it.entity)
        val key = ruleCommon?.typedId?:"?" //if (ruleCommon?.rule != null) "rule-${ruleCommon.id}" else if(ruleCommon?.ruleGroup != null) "group-${ruleCommon.id}" else "?"
        val data = MyData(key, ruleCommon?.id, ruleCommon?.label,
            ruleCommon?.description, ruleCommon?.rule?.remark, ruleCommon?.rule?.exprRemark)
        println("collect $key: ${ruleCommon?.label}")
        Pair(key, data)
    }


    RuleEngine.eval(rootList, dataProvider, loadChildrenFunc, toEvalRule, collector)

    //println收集的结果
    println("traverseResult: ${collector.resultMap.size}, root.children.size=${collector.root.children.size}")
    collector.traverseResult{
        println("${it.data?.key}. ${it.data?.label}, desc=${it.data?.desc}")
    }
//    collector.resultMap.forEach { k, v ->
//        println("key=${k} v=${v.data?.label}, v.parents=${v.parents.joinToString(",")},v.children=${v.children.joinToString(",")}")
//    }
}



fun testSqlLiteFind(sqlLiteHelper: SqlLiteHelper){
    val rs = sqlLiteHelper.find("select * from BirthInfo ORDER BY id DESC LIMIT 1")
    while (rs.next()) {
        println("by sql: " + rs.getInt("id"))
    }

    //"SELECT * FROM $tableName $wherePart"
    val rs2 = sqlLiteHelper.find("BirthInfo","ORDER BY id DESC LIMIT 1")
    while (rs2.next()) {
        println("by tableName and where: " + rs2.getInt("id"))
    }

    //不能查询到任何结果
    val rs3 = sqlLiteHelper.findBuggy("BirthInfo","id > ?"){
        it.setInt(1, 5)
       // it.setInt(2, 1)
    }
    while (rs3.next()) {
        println("by pstmt: " + rs3.getInt("id"))
    }
}

fun testSerialize(){
//    val json = "{\"_class\":\"Int\",\"key\":\"pos|紫微\",\"op\":\"in\",\"set\":{\"valueType\":\"Constant\",\"value\":[0,6]}}"
//    val expr:LogicalExpr = MySerializeJson.decodeFromString(json)
//    System.out.println("testSerialize:" + (expr is IntExpression))
//
//    val json2 = "{\"_class\":\"GongExpr\",\"key\":\"pos|紫微\",\"op\":\"isVip\"}"
//    val expr2:IExtExpr = MySerializeJson.decodeFromString(json2)
//    System.out.println("testSerialize:" + (expr2 is GongExpr))

    val op: Operand = LabelIntEnumValue(Gender.values().map{ SelectOption(it.label, it.ordinal) })
    println(MySerializeJson.encodeToString(op))//{"_class":"IntEnum","v":[{"label":"女","value":0},{"label":"男","value":1}]}

    val op2 = LabelIntEnumValue(Gender.values().map{ SelectOption(it.label, it.ordinal) })
    println(MySerializeJson.encodeToString(op2))//{"v":[{"label":"女","value":0},{"label":"男","value":1}]}

//    val str = "{\"v\":[{\"label\":\"博士\",\"value\":\"bs博士\"},{\"label\":\"力士\",\"value\":\"bs力士\"},{\"label\":\"青龙\",\"value\":\"bs青龙\"},{\"label\":\"小耗\",\"value\":\"bs小耗\"},{\"label\":\"将军\",\"value\":\"bs将军\"},{\"label\":\"奏书\",\"value\":\"bs奏书\"},{\"label\":\"飞廉\",\"value\":\"bs飞廉\"},{\"label\":\"喜神\",\"value\":\"bs喜神\"},{\"label\":\"病符\",\"value\":\"bs病符\"},{\"label\":\"大耗\",\"value\":\"bs大耗\"},{\"label\":\"伏兵\",\"value\":\"bs伏兵\"},{\"label\":\"官府\",\"value\":\"bs官府\"}]}"
//    val b: Operand = MySerializeJson.decodeFromString(str)
//    println("size=${b.v.size}")
}

fun  generateIds(){
    println((706..821).joinToString(",") { it.toString() })
}
