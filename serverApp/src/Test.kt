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
import com.github.rwsbillyang.yinyang.core.Gan

import com.github.rwsbillyang.yinyang.core.Gender
import com.github.rwsbillyang.yinyang.core.Zhi
import com.github.rwsbillyang.yinyang.ziwei.LunarLeapMonthAdjustMode
import com.github.rwsbillyang.yinyang.ziwei.ZwConstants
import com.github.rwsbillyang.yinyang.ziwei.ZwPanData
import com.github.rwsbillyang.yinyang.ziwei.rrt.*
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString


import org.komapper.core.dsl.Meta
import java.time.LocalDateTime

class MyData(val key:String, val id: Int?, val label: String?, val desc: String?)
class MyBaseCrudService(): AbstractSqlService(VoidCache()){
    override val dbSource: SqlDataSource
        get() = SqlDataSource("ruleEngineDb", "127.0.0.1", 3306, "root", "123456")
}

//若需在IDE中运行测试，需将依赖com.github.rwsbillyang:yinyang从 compileOnly 改为：implementationg
fun main(){
    val service = MyBaseCrudService()
    //runTest(service, Zhi.Zi, LocalDateTime.now())
    //testSerialize() //sealed class 不能🈶多个层次的继承

    insertZwExt(service)
   // insertConstants(service)
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

fun runTest(service: MyBaseCrudService,gongZhi: Int, dateTime: LocalDateTime){

    val zwPanData = ZwPanData.fromLocalDateTime(
        Gender.Female,
        dateTime,
        LunarLeapMonthAdjustMode.Whole)

    val gongStars = zwPanData.gongYuanMapByZhi[gongZhi]!!
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

    val json2 = "{\"_class\":\"GongExpr\",\"key\":\"pos|紫微\",\"op\":\"isVip\"}"
    val expr2:LogicalExpr = MySerializeJson.decodeFromString(json2)
    System.out.println("testSerialize:" + (expr2 is GongExpr))
}

/**
 * 添加rule runtime extension: Opcode + ParamType
 * */
fun insertZwExt(service: MyBaseCrudService){
    val domainId = 1

    val map = mutableMapOf<String, Opcode>()
    //将系统内置支持的操作符写入数据库，并构建map
    StarOpEnum.values().forEach {
        if(map[it.name] == null){
            map[it.name] = service.save(Meta.opcode, Opcode(it.label, it.name, Opcode.Ext, MySerializeJson.encodeToString(it.operandMap),false, domainId), true)
        }
    }

    GongOpEnum.values().forEach {
        if(map[it.name] == null){
            map[it.name] = service.save(Meta.opcode, Opcode(it.label, it.name, Opcode.Ext, MySerializeJson.encodeToString(it.operandMap),false, domainId), true)
        }
    }

    //构建内置数据类型并插入库
    val list = listOf(
        ParamType(StarType.label,StarType.code,StarType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Ext, false, domainId),
        ParamType(GongType.label,GongType.code,GongType.supportOperators().mapNotNull { map[it]?.id}.joinToString(","),ParamType.Ext, false, domainId),
    )
    val types = service.batchSave(Meta.paramType, list, true)
    println("types= ${MySerializeJson.encodeToString(types)}" )
}
private inline fun findTypeByCode(service: MyBaseCrudService, code: String) =
    service.findOne(Meta.paramType,{Meta.paramType.code eq code})?.id
fun insertConstants(service: MyBaseCrudService){
    val domainId = 1

    val intypeId = findTypeByCode(service, IType.Type_Int)?:-1
    val gan = Constant("天干", intypeId, MySerializeJson.encodeToString(IntEnumValue(Gan.nameList.mapIndexed{i, v -> SelectOption(v, i)})), true)
    val zhi = Constant("地支", intypeId, MySerializeJson.encodeToString(IntEnumValue(Zhi.nameList.mapIndexed{i, v -> SelectOption(v, i)})), true)
    val gender = Constant("性别", intypeId, MySerializeJson.encodeToString(Gender.values().map{SelectOption(it.label, it.ordinal)}), true)
    val bright = Constant("亮暗", intypeId, MySerializeJson.encodeToString(ZwConstants.Brightness.forEach { t, u -> SelectOption(u, t) }), true, domainId = domainId)

    val ret1 = service.batchSave(Meta.constant, listOf(gan, zhi, gender, bright), true)
    println("ret1= ${MySerializeJson.encodeToString(ret1)}" )

    val stringSetTypeId = findTypeByCode(service, IType.Type_StringSet)?:-1
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