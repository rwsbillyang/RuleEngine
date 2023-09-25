/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-09-20 20:32
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

package com.github.rwsbillyang.rule.composer


import com.github.rwsbillyang.ktorKit.cache.VoidCache
import com.github.rwsbillyang.ktorKit.db.AbstractSqlService
import com.github.rwsbillyang.ktorKit.db.SqlDataSource
import com.github.rwsbillyang.rule.runtime.*

import com.github.rwsbillyang.yinyang.core.Gender
import com.github.rwsbillyang.yinyang.core.Zhi
import com.github.rwsbillyang.yinyang.ziwei.LunarLeapMonthAdjustMode
import com.github.rwsbillyang.yinyang.ziwei.ZwPanData
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.polymorphic
import kotlinx.serialization.modules.subclass

import org.komapper.core.dsl.Meta
import java.time.LocalDateTime

class MyData(val key:String, val id: Int?, val label: String?, val desc: String?)
class MyBaseCrudService(): AbstractSqlService(VoidCache()){
    override val dbSource: SqlDataSource
        get() = SqlDataSource("ruleEngineDb", "127.0.0.1", 3306, "root", "123456")
}

//若需在IDE中运行测试，需将依赖com.github.rwsbillyang:yinyang从 compileOnly 改为：implementationg
fun main(){
    runTest(Zhi.Zi, LocalDateTime.now())
    //testSerialize() //sealed class 不能🈶多个层次的继承
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

fun runTest(gongZhi: Int, dateTime: LocalDateTime){

    val zwPanData = ZwPanData.fromLocalDateTime(
        Gender.Female,
        dateTime,
        LunarLeapMonthAdjustMode.Whole)

    val gongStars = zwPanData.gongYuanMap[gongZhi]!!
    println("====check gongStars: ${gongStars.name}======")

    val dataPicker: (key: String) -> Any? = {
        if(it.startsWith("pos|")){
            val arry = it.split("|").map{it.trim()}
            if(arry.size < 2){
                System.err.println("key error, no star after pos, key=$it")
                null
            }else
                zwPanData.starPosMap[arry[1]]
        }else{
            when(it){
                "gongName" -> gongStars.name
                "zhengYao" -> gongStars.zheng14Stars.toSet()
                "gongZhi" -> gongStars.zhi
                else -> {
                    System.err.println("not support key=$it, please check")
                    null
                }
            }
        }
    }

    val service = MyBaseCrudService()
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
            is Rule -> EvalRule(it.getExpr(), it.exclusive, it.thenAction, it.elseAction, it)
            is RuleGroup -> EvalRule(null, it.exclusive, null, null, it)
            else -> {
                System.err.println("toEvalRule: only support Rule/RuleGroup as extra for EvalRule")
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
        val ruleCommon = extra2RuleCommon(it.extra)
        val key = ruleCommon?.typedId?:"?" //if (ruleCommon?.rule != null) "rule-${ruleCommon.id}" else if(ruleCommon?.ruleGroup != null) "group-${ruleCommon.id}" else "?"
        val data = MyData(key, ruleCommon?.id, ruleCommon?.label, ruleCommon?.remark)
        println("collect $key: ${ruleCommon?.label}")
        Pair(key, data)
    }

    val rootList = service.findAll(Meta.ruleGroup, {Meta.ruleGroup.level eq 0})
    RuleEngine.eval(rootList, dataPicker, loadChildrenFunc, toEvalRule, collector)

    //println收集的结果
    println("traverseResult: ${collector.resultMap.size}, root.children.size=${collector.root.children.size}")
    collector.traverseResult{
        println("${it.data?.key}. ${it.data?.label}, desc=${it.data?.desc}")
    }
//    collector.resultMap.forEach { k, v ->
//        println("key=${k} v=${v.data?.label}, v.parents=${v.parents.joinToString(",")},v.children=${v.children.joinToString(",")}")
//    }
}

fun testSerialize(){
    val json = "{\"_class\":\"Int\",\"key\":\"pos|紫微\",\"op\":\"in\",\"set\":{\"valueType\":\"Constant\",\"value\":[0,6]}}"
    val expr:LogicalExpr = MySerializeJson.decodeFromString(json)
    System.out.println("testSerialize:" + (expr is IntExpression))

    val json2 = "{\"_class\":\"GongStarsExpr\",\"key\":\"pos|紫微\",\"op\":\"isVip\"}"
    val expr2:LogicalExpr = MySerializeJson.decodeFromString(json2)
    System.out.println("testSerialize:" + (expr2 is GongStarsExpr))
}



val ruleExtExprSerializersModule = SerializersModule {
    polymorphic(LogicalExpr::class){
        subclass(GongStarsExpr::class)
    }
}


/**
 * 自定义自己的表达式
 * */
@Serializable
@SerialName("GongStarsExpr")
class GongStarsExpr(
    val key: String,
    val op: String,
    //val value: User? == null // Any_value_type_can_be_serialized. eg: User
): LogicalExpr{
    override fun eval(dataPicker: (String) -> Any?) = when(op){
        "isVip" -> {
            //val v0 = map[key] as User? // Any_value_type_can_be_serialized?
            //v0.isVip()
            println("isVip?")
            false
        }
        "olderThan" -> {
            //val v0 = map[key] as User? // Any_value_type_can_be_serialized?
            //if(v0 == null || value == null) false else v0.age >= value.age
            println("olderThan?")
            false
        }
        "above" -> {
            //val v0 = map[key] as User? // Any_value_type_can_be_serialized?
            //if(v0 == null || value == null) false else v0.age >= value
            println("above?")
            false
        }
        else -> {
            throw Exception("GongStarsExpr not support operator: $op")
        }
    }
}