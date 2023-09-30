/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-09-29 20:30
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

import com.github.rwsbillyang.ktorKit.ApiJson
import com.github.rwsbillyang.rule.runtime.*
import com.github.rwsbillyang.yinyang.core.Gan
import com.github.rwsbillyang.yinyang.core.Gender
import com.github.rwsbillyang.yinyang.core.Zhi
import com.github.rwsbillyang.yinyang.ziwei.ZwConstants
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongOpEnum
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongType
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarOpEnum
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarType
import kotlinx.serialization.encodeToString
import org.komapper.core.dsl.Meta



/**
 * 添加rule runtime extension: Opcode + ParamType
 * */
fun insertZwExt(service: MyBaseCrudService){
    val domainId = 1

    val map = mutableMapOf<String, Opcode>()
    //将系统内置支持的操作符写入数据库，并构建map
    StarOpEnum.values().forEach {
        if(map[it.name] == null){
            map[it.name] = service.save(Meta.opcode, Opcode(it.label, it.name, Opcode.Ext, MySerializeJson.encodeToString(it.operandMap),false, domainId, it.remark), true)
        }
    }

    GongOpEnum.values().forEach {
        if(map[it.name] == null){
            map[it.name] = service.save(Meta.opcode, Opcode(it.label, it.name, Opcode.Ext, MySerializeJson.encodeToString(it.operandMap),false, domainId, it.remark), true)
        }
    }

    //构建内置数据类型并插入库
    val list = listOf(
        ParamType(
            StarType.label,
            StarType.code,
            StarType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), ParamType.Ext, false, domainId),
        ParamType(
            GongType.label,
            GongType.code,
            GongType.supportOperators().mapNotNull { map[it]?.id}.joinToString(","),ParamType.Ext, false, domainId),
    )
    val types = service.batchSave(Meta.paramType, list, true)
    println("types= ${MySerializeJson.encodeToString(types)}" )
}

private inline fun findTypeByCode(service: MyBaseCrudService, code: String) =
    service.findOne(Meta.paramType,{ Meta.paramType.code eq code})?.id

fun insertConstants(service: MyBaseCrudService){
    val domainId = 1

    val intypeId = findTypeByCode(service, IType.Type_Int)?:-1
    val gan = Constant("天干", intypeId, MySerializeJson.encodeToString(IntEnumValue(Gan.nameList.mapIndexed{ i, v -> SelectOption(v, i) })), true)
    val zhi = Constant("地支", intypeId, MySerializeJson.encodeToString(IntEnumValue(Zhi.nameList.mapIndexed{ i, v -> SelectOption(v, i) })), true)
    val gender = Constant("性别", intypeId, MySerializeJson.encodeToString(Gender.values().map{ SelectOption(it.label, it.ordinal) }), true)
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