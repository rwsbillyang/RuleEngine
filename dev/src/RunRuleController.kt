/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-07-14 23:38
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

import com.github.rwsbillyang.ktorKit.db.SqlLiteHelper

import com.github.rwsbillyang.rule.runtime.*
import com.github.rwsbillyang.yinyang.core.Gender
import com.github.rwsbillyang.yinyang.ziwei.GongStars
import com.github.rwsbillyang.yinyang.ziwei.ZwPanData
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongType
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarType
import com.github.rwsbillyang.rule.composer.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.komapper.core.dsl.Meta
import org.slf4j.LoggerFactory
import java.time.LocalDateTime

class MyData(val key:String, val id: Int?, val label: String?, val desc: String?, val remark: String?, val exprRemark: String?)

class RunRuleController: KoinComponent {
    private val log = LoggerFactory.getLogger("DevCrudController")

    val service: BaseCrudService by inject()

    fun runRule(ruleId: Int): String{
        val rootList = service.findAll(Meta.rule, {Meta.rule.id eq ruleId})
        val birthDate = LocalDateTime.of(1985,4,18,14,0)        //LocalDateTime.now(),

        val zwPanData = ZwPanData.fromLocalDateTime(Gender.Female, birthDate)
        val scopedGongStars: GongStars? = zwPanData.getGongStarsByName("福德宫") //null//
        //println("====check gongStars: ${gongStars.name}======")

        return runRuleEval(rootList, zwPanData, scopedGongStars)
    }




fun extra2RuleCommon(extra: Any?): RuleCommon?{
    if(extra == null) return null
    return when (extra) {
        is Rule -> extra.toRuleCommon(service, TableChildrenMode.None)
        is RuleGroup -> extra.toRuleCommon(service, TableChildrenMode.None)
        else -> {
            System.err.println("extra2RuleCommon: extra is not Rule/RuleGroup")
            null
        }
    }
}

/**
 * @param rootList 规则根节点列表
 * @param service 数据加载dao
 * @param zwPanData 全盘数据
 * @param scopedGongStars 对哪个宫垣进行规则验证分析，若规则不是针对本宫垣，则规则命中失败；若是全盘分析，则为空
 * */
fun runRuleEval(rootList: List<Any>,  zwPanData:ZwPanData, scopedGongStars: GongStars?): String{

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
                "scopedGongStars" -> scopedGongStars //指定了当前宫，则限制在当前宫
                "shenGong" -> zwPanData.getGongStarsByZhi(zwPanData.shenGong)
                "yearGan" -> zwPanData.fourZhu.year.gan
                "yearZhi" -> zwPanData.fourZhu.year.zhi
                "birthMonth" -> zwPanData.adjustedLeapMonth()
                "gender" -> zwPanData.gender.ordinal
                "x" -> 0
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
            "scopedGongStars" -> scopedGongStars //指定了当前宫，则限制在当前宫
            "shenGong" -> zwPanData.getGongStarsByZhi(zwPanData.shenGong)
            "yearGan" -> zwPanData.fourZhu.year.gan
            "yearZhi" -> zwPanData.fourZhu.year.zhi
            "birthMonth" -> zwPanData.adjustedLeapMonth()
            "gender" -> zwPanData.gender.ordinal
            "x" -> 0
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
                    val list1 = service.findAll(Meta.rule, { Meta.rule.id inList it.ruleChildrenIds!!.split(",").map{it.toInt()} })
                    list.addAll(list1)
                    //println("load Rule children size=${list1.size} for Rule=${it.label},id=${it.id}")
                }

                if(it.ruleGroupChildrenIds != null){
                    val list2 = service.findAll(Meta.ruleGroup, { Meta.ruleGroup.id inList it.ruleGroupChildrenIds!!.split(",").map{it.toInt()} })
                    list.addAll(list2)
                    //println("load RuleGroup children size=${list2.size} for Rule=${it.label},id=${it.id}")
                }

                list
            }

            is RuleGroup -> {
                val list = mutableListOf<Any>()
                if(it.ruleChildrenIds != null){
                    val list1 = service.findAll(Meta.rule, {Meta.rule.id inList it.ruleChildrenIds!!.split(",").map{it.toInt()} })
                    list.addAll(list1)
                    //println("load Rule children size=${list1.size} for RuleGroup=${it.label},id=${it.id}")
                }

                if(it.ruleGroupChildrenIds != null){
                    val list2 = service.findAll(Meta.ruleGroup, {Meta.ruleGroup.id inList it.ruleGroupChildrenIds!!.split(",").map{it.toInt()} })
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

//        RuleEngine.defaultAction = {currentRule, parentRule ->
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

    val toEvalRule: (extra: Any) -> LogicalEvalRule<MyData> = {
        when (it) {
            is Rule ->{
                val rule = it
                try {
                    LogicalEvalRule(it.getExpr(), it.exclusive == 1,dataProvider, loadChildrenFunc, collector, it, false)//{ "${rule.id}: ${rule.description}"}
                }catch (e: Exception){
                    println("Exception=${e.message}, it.id=${it.id}")
                    throw e
                }
            }
            is RuleGroup -> {
                val group = it
                LogicalEvalRule(it.getExpr()?:TrueExpression, it.exclusive == 1,dataProvider, loadChildrenFunc, collector, it, true)//{ "group-${group.id}: ${group.label}"}
            }
            else -> {
                System.err.println("toEvalRule: only support Rule/RuleGroup as extra for EvalRule： ${it.toString()}")
                throw Exception("only support Rule/RuleGroup as extra")
            }
        }
    }




    RuleEngine<MyData>().eval(rootList, toEvalRule)

    val sb = StringBuilder()
    //println收集的结果
    println("traverseResult: ${collector.resultMap.size}, root.children.size=${collector.root.children.size}")
    collector.traverseResult{
        val msg = "${it.data?.key}. ${it.data?.label}, desc=${it.data?.desc}\n"
        sb.append(msg)
        println(msg)
    }
//    collector.resultMap.forEach { k, v ->
//        println("key=${k} v=${v.data?.label}, v.parents=${v.parents.joinToString(",")},v.children=${v.children.joinToString(",")}")
//    }
    return sb.toString()
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
//fun testSerialize(){
//    val json = "{\"_class\":\"Int\",\"key\":\"pos|紫微\",\"op\":\"in\",\"set\":{\"valueType\":\"Constant\",\"value\":[0,6]}}"
//    val expr:LogicalExpr = MySerializeJson.decodeFromString(json)
//    System.out.println("testSerialize:" + (expr is IntExpression))
//
//    val json2 = "{\"_class\":\"GongExpr\",\"key\":\"pos|紫微\",\"op\":\"isVip\"}"
//    val expr2:IExtExpr = MySerializeJson.decodeFromString(json2)
//    System.out.println("testSerialize:" + (expr2 is GongExpr))
//
//    val op: Operand = LabelIntEnumValue(Gender.values().map{ SelectOption(it.label, it.ordinal) })
//    println(MySerializeJson.encodeToString(op))//{"_class":"IntEnum","v":[{"label":"女","value":0},{"label":"男","value":1}]}
//
//    val op2 = LabelIntEnumValue(Gender.values().map{ SelectOption(it.label, it.ordinal) })
//    println(MySerializeJson.encodeToString(op2))//{"v":[{"label":"女","value":0},{"label":"男","value":1}]}
//
////    val str = "{\"v\":[{\"label\":\"博士\",\"value\":\"bs博士\"},{\"label\":\"力士\",\"value\":\"bs力士\"},{\"label\":\"青龙\",\"value\":\"bs青龙\"},{\"label\":\"小耗\",\"value\":\"bs小耗\"},{\"label\":\"将军\",\"value\":\"bs将军\"},{\"label\":\"奏书\",\"value\":\"bs奏书\"},{\"label\":\"飞廉\",\"value\":\"bs飞廉\"},{\"label\":\"喜神\",\"value\":\"bs喜神\"},{\"label\":\"病符\",\"value\":\"bs病符\"},{\"label\":\"大耗\",\"value\":\"bs大耗\"},{\"label\":\"伏兵\",\"value\":\"bs伏兵\"},{\"label\":\"官府\",\"value\":\"bs官府\"}]}"
////    val b: Operand = MySerializeJson.decodeFromString(str)
////    println("size=${b.v.size}")
//}
}


