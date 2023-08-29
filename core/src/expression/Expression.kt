/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-07-10 12:57
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

package com.github.rwsbillyang.ruleEngine.core.expression


import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.UseContextualSerialization
import java.time.LocalDateTime

/**
 *
 * Typescript中的写法更简单：
export interface Expr{
    _class: string, //后端需要做序列化
}

export interface BasicExpression extends Expr{
    key: string//值为: BasicExpressionMeta.param.mapKey
    op: string //Operator.code
    other?: boolean | string | number | string[] | number[]
    start?: string | number//key所在变量范围比较
    end?: string | number//key所在变量范围比较
    set?: string[] | number[]//key所在变量是否存在于set中
    e?:  string | number //key所在变量集中是否包含e
    num?: number //key所在变量集与other交集元素个事 与num比较
}
export interface ComplexExpression  extends Expr{
    op: string
    sub: BasicExpression[]
}
 * */
sealed class LogicalExpr{
    abstract fun eval(dataPicker: (String) -> Any?): Boolean
}

abstract class BasicExpression: LogicalExpr(){
    abstract val key: String
    abstract val op: String
}

enum class ValueType{
    Param, Constant, JsonValue
}

@Serializable
class OpValue<T>(
    val valueType: ValueType,
    val key: String? = null, //key: other, start, end, set, e, number, if valueType == ValueType.Param then use key to pick a value
    val value: T? = null //else use value directly
){
    fun real(dataPicker: (String) -> Any?)
    = if(valueType == ValueType.Param && key != null){
        dataPicker(key) as? T?
    }else{
        value
    }
}



@Serializable
@SerialName(IType.Type_Bool)
class BoolExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<Boolean>
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) 
    = BoolType.op(op, dataPicker(key) as Boolean?, other.real(dataPicker))
}

@Serializable
@SerialName(IType.Type_Int)
class IntExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<Int>? = null,
    val start: OpValue<Int>? = null,//key所在变量范围比较
    val end: OpValue<Int>? = null,//key所在变量范围比较
    val set: OpValue<Set<Int>>? = null//key所在变量是否存在于set中
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) =
            IntType.op(op, dataPicker(key) as Int?,
               other?.real(dataPicker), start?.real(dataPicker), end?.real(dataPicker), set?.real(dataPicker))

}


@Serializable
@SerialName(IType.Type_Long)
class LongExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<Long>? = null,
    val start: OpValue<Long>? = null,
    val end: OpValue<Long>? = null,
    val set: OpValue<Set<Long>>? = null
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) = LongType.op(op, dataPicker(key) as Long?,
        other?.real(dataPicker), start?.real(dataPicker), end?.real(dataPicker), set?.real(dataPicker))
}

@Serializable
@SerialName(IType.Type_Double)
class DoubleExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<Double>? = null,
    val start: OpValue<Double>? = null,
    val end: OpValue<Double>? = null,
    val set: OpValue<Set<Double>>? = null
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) = DoubleType.op(op, dataPicker(key) as Double?,  other?.real(dataPicker), start?.real(dataPicker), end?.real(dataPicker), set?.real(dataPicker))
}


@Serializable
@SerialName(IType.Type_String)
class StringExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<String>? = null,
    val start: OpValue<String>? = null,
    val end: OpValue<String>? = null,
    val set: OpValue<Set<String>>? = null
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) = StringType.op(op, dataPicker(key) as String?,  other?.real(dataPicker), start?.real(dataPicker), end?.real(dataPicker), set?.real(dataPicker))
}



@Serializable
@SerialName(IType.Type_Datetime)
class DatetimeExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<LocalDateTime>? = null,
    val start: OpValue<LocalDateTime>? = null,
    val end: OpValue<LocalDateTime>? = null,
    val set: OpValue<Set<LocalDateTime>>? = null
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) = DateTimeType.op(op, dataPicker(key) as LocalDateTime?,  other?.real(dataPicker), start?.real(dataPicker), end?.real(dataPicker), set?.real(dataPicker))
}

@Serializable
@SerialName(IType.Type_IntSet)
class IntSetExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<Set<Int>>? = null,
    val e: OpValue<Int>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) = IntSetType.op(op,  dataPicker(key) as Set<Int>?, other?.real(dataPicker), e?.real(dataPicker), num?.real(dataPicker))
}

@Serializable
@SerialName(IType.Type_LongSet)
class LongSetExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<Set<Long>>? = null,
    val e: OpValue<Long>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) = LongSetType.op(op,  dataPicker(key) as Set<Long>?, other?.real(dataPicker), e?.real(dataPicker), num?.real(dataPicker))
}

@Serializable
@SerialName(IType.Type_DoubleSet)
class DoubleSetExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<Set<Double>>? = null,
    val e: OpValue<Double>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) = DoubleSetType.op(op, dataPicker(key) as Set<Double>?, other?.real(dataPicker), e?.real(dataPicker), num?.real(dataPicker))
}

@Serializable
@SerialName(IType.Type_StringSet)
class StringSetExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<Set<String>>? = null,
    val e: OpValue<String>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) = StringSetType.op(op,  dataPicker(key) as Set<String>?, other?.real(dataPicker), e?.real(dataPicker), num?.real(dataPicker))
}

@Serializable
@SerialName(IType.Type_DateTimeSet)
class DateTimeSetExpression(
    override val key: String,
    override val op: String,
    val other: OpValue<Set<LocalDateTime>>? = null,
    val e: OpValue<LocalDateTime>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): BasicExpression() {
    override fun eval(dataPicker: (String) -> Any?) = DateTimeSetType.op(op,  dataPicker(key) as Set<LocalDateTime>?, other?.real(dataPicker), e?.real(dataPicker), num?.real(dataPicker))
}