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
import com.github.rwsbillyang.rule.composer.*
import com.github.rwsbillyang.rule.runtime.*
import com.github.rwsbillyang.yinyang.core.Gan
import com.github.rwsbillyang.yinyang.core.Gender
import com.github.rwsbillyang.yinyang.core.Zhi
import com.github.rwsbillyang.yinyang.ziwei.StarCategory
import com.github.rwsbillyang.yinyang.ziwei.ZwConstants
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongOpEnum
import com.github.rwsbillyang.yinyang.ziwei.rrt.GongType
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarOpEnum
import com.github.rwsbillyang.yinyang.ziwei.rrt.StarType
import kotlinx.serialization.encodeToString
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.komapper.core.dsl.Meta
import org.komapper.core.dsl.QueryDsl



/**
 * 初始化RuleEngin数据库，包括基本类型及其操作，以及zw扩展类型及其支持的操作，以及部分zw常量
 * */
class InitDbController: KoinComponent{
    val service: BaseCrudService by inject()
    /**
     * 元数据初始化，包括基本数据类型，以及它们支持的基本操作
     * 清空类型和操作符表，并从id=1开始添加
     * */
    fun initMetaDataInDb(): String {
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

        val json = ApiJson.json()
        val opsJson = json.encodeToString(map)
        val typesJson = json.encodeToString(types)
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

    fun upsertConstants(): String{
        val domainId = 1

        val intypeId = findParamTypeIdByCode(IType.Type_Int)?:-1

        //需声明为Operand类型，才能输出_class字段
        var op: Operand = LabelIntEnumValue(Gan.nameList.mapIndexed{ i, v -> SelectOption(v, i) })
        val gan = Constant("天干", intypeId, MySerializeJson.encodeToString(op), true)

        val op2: Operand = LabelIntEnumValue(Zhi.nameList.mapIndexed{ i, v -> SelectOption(v, i) })
        val zhi = Constant("地支", intypeId, MySerializeJson.encodeToString(op2), true)

        val op3: Operand = LabelIntEnumValue(Gender.values().map{ SelectOption(it.label, it.ordinal) })
        val gender = Constant("性别", intypeId, MySerializeJson.encodeToString(op3), true)

        val op4: Operand = LabelIntEnumValue(ZwConstants.Brightness.entries.map { SelectOption(it.value, it.key) })
        val bright = Constant("亮暗", intypeId, MySerializeJson.encodeToString(op4), true, domainId = domainId)

        val stringSetTypeId = findParamTypeIdByCode(IType.Type_StringSet)?:-1
        val list2 = mapOf(
            "十二宫垣" to Pair(ZwConstants.twelveGongName.toSet() + "身宫", "逆时针"),
            "正曜" to Pair(ZwConstants.Zheng14Stars, null),
            "辅曜" to Pair(ZwConstants.FuStars, "他力"),
            "佐曜" to Pair(ZwConstants.ZuoStars, "自力"),
            "四煞" to Pair(ZwConstants.FourShaStars, null),
            "化曜" to Pair(ZwConstants.FourHua, null),
            "空劫" to Pair(ZwConstants.KongJieStars, null),
            "空曜" to Pair(ZwConstants.KongStars, "指空劫与天空。截空、旬空亦可算作空曜，但力量较弱"),
            "刑曜" to Pair(ZwConstants.XingStars, null),
            "忌曜" to Pair(ZwConstants.JiStars, null),
            "桃花" to Pair(ZwConstants.TaoHuaStars, "廉贞贪狼虽有性质"),
            "文曜" to Pair(ZwConstants.WenStars, null),
            "科名" to Pair(ZwConstants.KeMingStars, "文曜加上三台八座,恩光天贵, 台辅封诰,天官天福八曜"),
            "杂曜-恶" to Pair(ZwConstants.ZaStars_Bad, null),
            "杂曜-吉" to Pair(ZwConstants.ZaStars_Good, null),
            "杂曜" to Pair(ZwConstants.ZaStars, null),
            "长生12神" to Pair(ZwConstants.ZhangSheng12Stars.toSet(), null),
        ).map {
            op = StringSetValue(it.value.first)
            Constant(it.key, stringSetTypeId,
                MySerializeJson.encodeToString(op), remark = it.value.second, domainId = domainId)
        }

        val stringTypeId = findParamTypeIdByCode(IType.Type_String)?:-1
        //特殊处理，星曜值的前面加前缀，目的解决查询宫支位置时星曜名称重复问题
        op = LabelStringEnumValue(ZwConstants.BoShi12Stars.map{ SelectOption(it, StarCategory.BoShi12.prefix+it) })
        val boshi = Constant("博士12神", stringTypeId, MySerializeJson.encodeToString(op), true, domainId = domainId)

        op = LabelStringEnumValue(ZwConstants.SuiQian12Stars.map{ SelectOption(it, StarCategory.SuiQian12.prefix+it) })
        val suiqian = Constant("岁前12星", stringTypeId, MySerializeJson.encodeToString(op), true, domainId = domainId)

        op = LabelStringEnumValue(ZwConstants.JiangQian12Stars.map{ SelectOption(it, StarCategory.JiangQian12.prefix+it) })
        val jiangqian = Constant("将前12星", stringTypeId, MySerializeJson.encodeToString(op), true, domainId = domainId)


        val list = listOf(gan, zhi, gender, bright) + list2 + listOf(boshi, suiqian, jiangqian)

        var sb = StringBuffer()
        list.forEach {
            val oldId = service.findOne(Meta.constant, {Meta.constant.label eq it.label})?.id
            if(oldId != null){
                it.id = oldId
            }
            service.save(Meta.constant, it, oldId == null)
            sb.append("upsert done: ${it.label}, id=$oldId\n" )
        }
        return sb.toString()
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
                    val oldOperandCfgMap:Map<String, OperandConfig> = MySerializeJson.decodeFromString(old.operandConfigMapStr!!)
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
                        v.contantIds, e.selectOptions, e.defaultSelect,e.defaultType,e.enable)
                }
            }
        }
        return newOperandCfgMap
    }


    private fun findParamTypeIdByCode(code: String) =
        service.findOne(Meta.paramType,{ Meta.paramType.code eq code})?.id


}
