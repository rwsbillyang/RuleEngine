/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-09-26 10:45
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

@file:UseContextualSerialization(LocalDateTime::class)

package com.github.rwsbillyang.rule.runtime

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.UseContextualSerialization
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * 一个逻辑表达式构成因素：表达式类型（变量类型决定）、变量（mapKey或记录库中添加的变量记录）、操作码、若干操作数构成
 * 不同的操作码会有不同的操作数，OperandConfig正是操作数的配置
 * 系统内置操作码预先生成，不可修改
 *
 * 放入runtime库，用于初始化各种OpEnum，然后插入数据库Opcode表中
 *
 * @param label 创建表达式或规则时，输入时操作数时的提示标签
 * @param tooltip 创建表达式或规则时，输入时操作数时的提示帮助提示
 * @param multiple 用于创建表达式或规则时，选择输入框过滤常量是否多选 当typeCode是基本类型时，操作数也可能是其对应的容器类型，
 * @param required 操作数是否必须填写
 * @param typeCode 操作数数据类型，null表示与变量类型一致；用于创建表达式或规则时，选择输入框过滤常量或变量
 * @param contantIds 操作数值域，用于创建表达式或规则时，选择输入框过滤常量 UI中创建自定义操作码时需要指定
 * @param selectOptions 操作数值域，不是从远程加载常量，而是指定的选择范围内选
 * @param defaultSelect 操作数值域select默认值
 * @param defaultOperandValueType 前端OperandMeta.valueType: "Param" | "Constant" | "Operand"
 * @param enable 一般总是激活状态
 *
 * */
@Serializable
class OperandConfig(
    val label: String,
    val tooltip: String? = null,
    val multiple: Boolean = false, //
    val required: Boolean = true, //操作数是否必须填写
    val typeCode: String? = null,//操作数数据类型，null表示操作数与与变量类型一致
    val contantIds: List<Int>? = null, //操作数值域，常量id数组[1,2,3]
    val selectOptions: List<SelectOption<String>>? = null,//操作数值域，不是从远程加载常量，而是指定的选择范围内选
    val defaultSelect: String? = null,
    val defaultType: String? = null, //"Param" | "Constant" | "Operand"
    val enable: Boolean = true
)

@Serializable
class SelectOption<T>(val label: String, val value: T)

@Serializable
enum class OperandValueType { P, C, J} //前端OperandMeta.t: Param, Constant, Operand


/**
 * 操作数
 * @param name 操作数名称
 * @param typeCode 操作数类型code，null表示与变量类型一致
 * @param
 * */
@Deprecated("use MiniOperand instead, only necessary when deserialize OperandMeta")
@Serializable
class OperandMiniMeta(
    val t: OperandValueType,
    val key: String? = null, //key: other, start, end, set, e, number, if valueType == ValueType.Param then use key to pick a value
    val value: Operand? = null //else use value directly
) {
    fun raw(dataProvider: (key: String, keyExtra: String?) -> Any?, keyExtra: String? = null) =
        if (t == OperandValueType.P && key != null) {
            dataProvider(key, keyExtra)
        } else {
            value?.v
        }
}


/**
 * 子类的json中会默认增加type字段，值为@SerialName中的
 * 使用interface代替sealed class可进行外部扩展，
 * 但需要定义SerializersModule进行polymorphic，且序列化时需将变量声明为接口类型
 * 参见：https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/polymorphism.md#open-polymorphism
 * */
//@Serializable
interface Operand{
    val v: Any //实际的值
    fun raw(
        dataProvider: (key: String, keyExtra: String?) -> Any?,
        keyExtra: String? = null) = if(this is VariableValue) dataProvider(v, keyExtra) else v

    fun humanReadString() = if(this is VariableValue) "\$$v" else "$v"
}


@Serializable
@SerialName(IType.Type_Bool)
class BoolValue(override val v: Boolean) : Operand

@Serializable
@SerialName(IType.Type_Int)
class IntValue(override val v: Int) : Operand

@Serializable
@SerialName(IType.Type_Long)
class LongValue(override val v: Long) : Operand
@Serializable
@SerialName(IType.Type_Double)
class DoubleValue(override val v: Double) : Operand

@Serializable
@SerialName(IType.Type_String)
class StringValue(override val v: String) : Operand

@Serializable
@SerialName(IType.Type_Datetime)
class LocalDateTimeValue(override val v: LocalDateTime) : Operand{
    override fun humanReadString() =  v.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
}

@Serializable
@SerialName(IType.Type_IntSet)
class IntSetValue(override val v: Set<Int>) : Operand


@Serializable
@SerialName(IType.Type_LongSet)
class LongSetValue(override val v: Set<Long>) : Operand

@Serializable
@SerialName(IType.Type_DoubleSet)
class DoubleSetValue(override val v: Set<Double>) : Operand

@Serializable
@SerialName(IType.Type_StringSet)
class StringSetValue(override val v: Set<String>) : Operand

@Serializable
@SerialName(IType.Type_DateTimeSet)
class LocalDateTimeSetValue(override val v: Set<LocalDateTime>) : Operand{
    override fun humanReadString() =  v.joinToString(",", "[", "]") { it.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) }
}


// 以下为枚举类型,为枚举增加了枚举名称label


//T: Int, Long, Double, String, DateTime

@Serializable
@SerialName(IType.Type_IntEnum)
class LabelIntEnumValue(override val v: List<SelectOption<Int>>) : Operand


@Serializable
@SerialName(IType.Type_LongEnum)
class LabelLongEnumValue(override val v: List<SelectOption<Long>>) : Operand

@Serializable
@SerialName(IType.Type_DoubleEnum)
class LabelDoubleEnumValue(override val v: List<SelectOption<Double>>) : Operand

@Serializable
@SerialName(IType.Type_StringEnum)
class LabelStringEnumValue(override val v: List<SelectOption<String>>) : Operand

@Serializable
@SerialName(IType.Type_DateTimeEnum)
class LabelLocalDateTimeEnumValue(override val v: List<SelectOption<LocalDateTime>>) : Operand




/**
 *  操作数是一个变量,由v标识
 * */
@Serializable
@SerialName(IType.Type_Variable)
class VariableValue(override val v: String) : Operand


