/*
 * Copyright © 2023 rwsbillyang@qq.com 
 *  
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-08-25 22:51
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

//@file:UseSerializers(LocalDateTime::class)
@file:UseContextualSerialization(LocalDateTime::class)
package com.github.rwsbillyang.rule.composer

import com.github.rwsbillyang.rule.runtime.IType
import com.github.rwsbillyang.rule.runtime.SelectOption
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.UseContextualSerialization
import java.time.LocalDateTime

@Serializable
sealed class ExpressionMeta

@Serializable
@SerialName("basic")
class BasicExpressionMeta(
    val paramId: Int,
    val param: Param? = null,
    val opId: Int,
    val op: Opcode? = null,
    val other: ValueMeta? = null,
    val start: ValueMeta? = null,//key所在变量范围比较
    val end: ValueMeta? = null,//key所在变量范围比较
    val set: ValueMeta? = null,//key所在变量是否存在于set中
    val e: ValueMeta? = null, //key所在变量集中是否包含e
    val num: ValueMeta? = null //key所在变量集与other交集元素个事 与num比较
): ExpressionMeta()

@Serializable
class ValueMeta(
    val valueType: String , //"Param" | "Constant" | "JsonValue" | undefined
    val paramId: Int? = null,
    val param: Param? = null,
    //val constantIds: Int? = null, //树形select的option的value 树形单选：[1, "乙"] 以及 [4]；多选选中多个[[1, '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
    val constantIdsStr: String? = null,
    //val constants: List<Constant>? = null,
    val value: JsonValue? = null
)

@Serializable
@SerialName(IType.Type_Complex)
class ComplexExpressionMeta(
    val op: Opcode,
    val metaList: List<ExpressionMeta>
): ExpressionMeta()

/**
 * 子类的json中会默认增加type字段，值为@SerialName中的
 * */
@Serializable
sealed class JsonValue

@Serializable
@SerialName(IType.Type_Bool)
class BoolValue(
    val value: Boolean
): JsonValue()

@Serializable
@SerialName(IType.Type_Int)
class IntValue(
    val value: Int
): JsonValue()

@Serializable
@SerialName(IType.Type_Long)
class LongValue(
    val value: Long
): JsonValue()

@Serializable
@SerialName(IType.Type_Double)
class DoubleValue(
    val value: Double
): JsonValue()

@Serializable
@SerialName(IType.Type_String)
class StringValue(
    val value: String
): JsonValue()

@Serializable
@SerialName(IType.Type_Datetime)
class LocalDateTimeValue(
    val value: LocalDateTime
): JsonValue()

@Serializable
@SerialName(IType.Type_IntSet)
class IntSetValue(
    val value: Set<Int>
): JsonValue()


@Serializable
@SerialName(IType.Type_LongSet)
class LongSetValue(
    val value: Set<Long>
): JsonValue()

@Serializable
@SerialName(IType.Type_DoubleSet)
class DoubleSetValue(
    val value: Set<Double>
): JsonValue()

@Serializable
@SerialName(IType.Type_StringSet)
class StringSetValue(
    val value: Set<String>
): JsonValue()

@Serializable
@SerialName(IType.Type_DateTimeSet)
class LocalDateTimeSetValue(
    val value: Set<LocalDateTime>
): JsonValue()





// 以下为枚举类型,为枚举增加了枚举名称label


//T: Int, Long, Double, String, DateTime

@Serializable
@SerialName(IType.Type_IntEnum)
class IntEnumValue(
    val value: List<SelectOption<Int>>
): JsonValue()


@Serializable
@SerialName(IType.Type_LongEnum)
class LongEnumValue(
    val value: List<SelectOption<Long>>
): JsonValue()

@Serializable
@SerialName(IType.Type_DoubleEnum)
class DoubleEnumValue(
    val value: List<SelectOption<Double>>
): JsonValue()

@Serializable
@SerialName(IType.Type_StringEnum)
class StringEnumValue(
    val value: List<SelectOption<String>>
): JsonValue()

@Serializable
@SerialName(IType.Type_DateTimeEnum)
class LocalDateTimeEnumValue(
    val value: List<SelectOption<LocalDateTime>>
): JsonValue()