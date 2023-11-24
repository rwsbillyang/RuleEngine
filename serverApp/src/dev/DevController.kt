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
import com.github.rwsbillyang.ktorKit.db.AbstractSqlService
import com.github.rwsbillyang.rule.composer.*
import com.github.rwsbillyang.rule.runtime.*
import com.github.rwsbillyang.yinyang.core.Gan
import com.github.rwsbillyang.yinyang.core.Gender
import com.github.rwsbillyang.yinyang.core.Zhi
import com.github.rwsbillyang.yinyang.ziwei.ZwConstants
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongOpEnum
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongType
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarOpEnum
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarType
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import org.komapper.core.dsl.Meta
import org.komapper.core.dsl.QueryDsl



/**
 * 初始化RuleEngin数据库，包括基本类型及其操作，以及zw扩展类型及其支持的操作，以及部分zw常量
 * */
class DevController(val service: AbstractSqlService){
    /**
     * 元数据初始化，包括基本数据类型，以及它们支持的基本操作
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
     * 添加（若有旧值则更新）zw rule runtime extension: Opcode + ParamType
     * */
    fun upsertZwRRtExt(): String{
        val domainId = 1

        upsertTypeAndOps(StarType.label, StarType.code, StarType.supportOperators(),
            domainId, StarOpEnum.values().map { Pair(it.name, it) }
        )
        upsertTypeAndOps(GongType.label, GongType.code, GongType.supportOperators(),
            domainId, GongOpEnum.values().map { Pair(it.name, it) }
        )

        //构建内置数据类型并插入库
        println("upsert zw rrt ext done" )
        return "Done"
    }

    fun insertConstants(){
        val domainId = 1

        val intypeId = findParamTypeIdByCode(IType.Type_Int)?:-1
        val gan = Constant("天干", intypeId, MySerializeJson.encodeToString(LabelIntEnumValue(Gan.nameList.mapIndexed{ i, v -> SelectOption(v, i) })), true)
        val zhi = Constant("地支", intypeId, MySerializeJson.encodeToString(LabelIntEnumValue(Zhi.nameList.mapIndexed{ i, v -> SelectOption(v, i) })), true)
        val gender = Constant("性别", intypeId, MySerializeJson.encodeToString(Gender.values().map{ SelectOption(it.label, it.ordinal) }), true)
        val bright = Constant("亮暗", intypeId, MySerializeJson.encodeToString(ZwConstants.Brightness.forEach { t, u -> SelectOption(u, t) }), true, domainId = domainId)

        val ret1 = service.batchSave(Meta.constant, listOf(gan, zhi, gender, bright), true)
        println("ret1= ${MySerializeJson.encodeToString(ret1)}" )

        val stringSetTypeId = findParamTypeIdByCode(IType.Type_StringSet)?:-1
        val list = mapOf(
            "十二宫" to Pair(ZwConstants.twelveGongName.toSet(), "逆时针"),
            "正曜" to Pair(ZwConstants.Zheng14Stars, null),
            "辅佐曜" to Pair(ZwConstants.FuZuoStars, null),
            "四煞" to Pair(ZwConstants.FourShaStars, ""),
            "空劫" to Pair(ZwConstants.KongJieStars, null),
            "化曜" to Pair(ZwConstants.FourHua, null),
            "杂曜" to Pair(ZwConstants.ZaStars, null),
            "空曜" to Pair(ZwConstants.KongStars, "指空劫与天空。截空、旬空亦可算作空曜，但力量较弱"),
            "刑曜" to Pair(ZwConstants.XingStars, null),
            "忌曜" to Pair(ZwConstants.JiStars, null),
            "桃花诸曜" to Pair(ZwConstants.TaoHuaStars, "廉贞贪狼虽有性质"),
            "文曜" to Pair(ZwConstants.WenStars, null),
            "科名诸曜" to Pair(ZwConstants.KeMingStars, "文曜加上三台八座,恩光天贵, 台辅封诰,天官天福八曜"),
            "博士12神" to Pair(ZwConstants.BoShi12Stars.toSet(), null),
            "长生12神" to Pair(ZwConstants.ZhangSheng12Stars.toSet(), null),
            "岁前12星" to Pair(ZwConstants.SuiQian12Stars.toSet(), null),
            "将前12星" to Pair(ZwConstants.JiangQian12Stars.toSet(), null),
        ).map {
            Constant(it.key, stringSetTypeId,
                MySerializeJson.encodeToString(StringSetValue(it.value.first)), remark = it.value.second, domainId = domainId)
        }

        val ret2 = service.batchSave(Meta.constant, list, true)
        println("ret2= ${MySerializeJson.encodeToString(ret2)}" )
    }


    private fun upsertTypeAndOps(paramTypeLabel:String, paramTypeCode: String,
                                 paramTypeLabelSupportOperators: List<String>,
                                 domainId: Int, enumOps: List<Pair<String,IExtOpEnum>>): String{
        val map = mutableMapOf<String, Opcode>()
        //将系统内置支持的操作符写入数据库，并构建map
        //若操作符code相同则被后面的type覆盖更新
        enumOps.forEach {
            val old = service.findOne(Meta.opcode, {
                Meta.opcode.code eq it.first
                Meta.opcode.type eq paramTypeCode //StarType.classDiscriminator
            })
            try {
                //将旧配置中的值域等信息提取出来，不覆盖掉
                val operandCfgMap = if(old?.operandConfigMapStr != null){
                    val oldOperandCfgMap:Map<String, OperandConfig> = MySerializeJson.decodeFromString(old.operandConfigMapStr)
                    mergeOperandCfgConstantIdsToNew(oldOperandCfgMap, it.second.operandCfgMap.toMutableMap())
                } else it.second.operandCfgMap
                map[it.first] = service.save(Meta.opcode, Opcode(it.second.label, it.first, paramTypeCode,
                    MySerializeJson.encodeToString(operandCfgMap),false, domainId, it.second.remark?:paramTypeCode, old?.id),
                    old == null)
            }catch (e: Exception){
                System.err.println("old=$old")
                return "Error: $old"
            }
        }

        val paramType = ParamType(paramTypeLabel, paramTypeCode, paramTypeLabelSupportOperators.mapNotNull { map[it]?.id}.joinToString(","),
            ParamType.Ext, false, domainId, findParamTypeIdByCode(paramTypeCode))
        service.save(Meta.paramType, paramType, paramType.id == null)
        return "Done, upsert"
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


    private fun findParamTypeIdByCode(code: String) =
        service.findOne(Meta.paramType,{ Meta.paramType.code eq code})?.id


}
