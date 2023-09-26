/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-09-25 09:01
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

package com.github.rwsbillyang.rule.runtime


import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.UseContextualSerialization
import kotlinx.serialization.modules.*
import java.time.LocalDateTime



//@Serializable
//sealed class LogicalExpr{
//    abstract fun eval(dataProvider: (String) -> Any?): Boolean
//}

//@Serializable
//abstract class LogicalExpr{
//    abstract fun eval(dataProvider: (String) -> Any?): Boolean
//}
interface LogicalExpr{
    fun eval(dataProvider: (String) -> Any?): Boolean
}


//在sealed class与具体子类之间，多加了一个类层次，导致反序列化时报错：
//JsonDecodingException: Polymorphic serializer was not found for class discriminator
//@Serializable
//@SerialName("Basic")
//abstract class BasicExpression: LogicalExpr(){
//    abstract val key: String
//    abstract val op: String
//}



@Serializable
@SerialName(IType.Type_Bool)
class BoolExpression(
    val key: String,
    val op: String,
    val other: OpValue<Boolean>
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) 
    = BoolType.op(op, dataProvider(key) as Boolean?, other.real(dataProvider))
}

@Serializable
@SerialName(IType.Type_Int)
class IntExpression(
    val key: String,
    val op: String,
    val other: OpValue<Int>? = null,
    val start: OpValue<Int>? = null,//key所在变量范围比较
    val end: OpValue<Int>? = null,//key所在变量范围比较
    val set: OpValue<Set<Int>>? = null//key所在变量是否存在于set中
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) =
        IntType.op(
            op, dataProvider(key) as Int?,
            other?.real(dataProvider), start?.real(dataProvider), end?.real(dataProvider), set?.real(dataProvider)
        )

}


@Serializable
@SerialName(IType.Type_Long)
class LongExpression(
    val key: String,
    val op: String,
    val other: OpValue<Long>? = null,
    val start: OpValue<Long>? = null,
    val end: OpValue<Long>? = null,
    val set: OpValue<Set<Long>>? = null
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) = LongType.op(
        op, dataProvider(key) as Long?,
        other?.real(dataProvider), start?.real(dataProvider), end?.real(dataProvider), set?.real(dataProvider)
    )
}

@Serializable
@SerialName(IType.Type_Double)
class DoubleExpression(
    val key: String,
    val op: String,
    val other: OpValue<Double>? = null,
    val start: OpValue<Double>? = null,
    val end: OpValue<Double>? = null,
    val set: OpValue<Set<Double>>? = null
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) = DoubleType.op(
        op,
        dataProvider(key) as Double?,
        other?.real(dataProvider),
        start?.real(dataProvider),
        end?.real(dataProvider),
        set?.real(dataProvider)
    )
}


@Serializable
@SerialName(IType.Type_String)
class StringExpression(
    val key: String,
    val op: String,
    val other: OpValue<String>? = null,
    val start: OpValue<String>? = null,
    val end: OpValue<String>? = null,
    val set: OpValue<Set<String>>? = null
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) = StringType.op(
        op,
        dataProvider(key) as String?,
        other?.real(dataProvider),
        start?.real(dataProvider),
        end?.real(dataProvider),
        set?.real(dataProvider)
    )
}



@Serializable
@SerialName(IType.Type_Datetime)
class DatetimeExpression(
    val key: String,
    val op: String,
    val other: OpValue<LocalDateTime>? = null,
    val start: OpValue<LocalDateTime>? = null,
    val end: OpValue<LocalDateTime>? = null,
    val set: OpValue<Set<LocalDateTime>>? = null
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) = DateTimeType.op(
        op,
        dataProvider(key) as LocalDateTime?,
        other?.real(dataProvider),
        start?.real(dataProvider),
        end?.real(dataProvider),
        set?.real(dataProvider)
    )
}

@Serializable
@SerialName(IType.Type_IntSet)
class IntSetExpression(
    val key: String,
    val op: String,
    val other: OpValue<Set<Int>>? = null,
    val e: OpValue<Int>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) = IntSetType.op(op,  dataProvider(key) as Set<Int>?, other?.real(dataProvider), e?.real(dataProvider), num?.real(dataProvider))
}

@Serializable
@SerialName(IType.Type_LongSet)
class LongSetExpression(
    val key: String,
    val op: String,
    val other: OpValue<Set<Long>>? = null,
    val e: OpValue<Long>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) = LongSetType.op(op,  dataProvider(key) as Set<Long>?, other?.real(dataProvider), e?.real(dataProvider), num?.real(dataProvider))
}

@Serializable
@SerialName(IType.Type_DoubleSet)
class DoubleSetExpression(
    val key: String,
    val op: String,
    val other: OpValue<Set<Double>>? = null,
    val e: OpValue<Double>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) = DoubleSetType.op(op, dataProvider(key) as Set<Double>?, other?.real(dataProvider), e?.real(dataProvider), num?.real(dataProvider))
}

@Serializable
@SerialName(IType.Type_StringSet)
class StringSetExpression(
    val key: String,
    val op: String,
    val other: OpValue<Set<String>>? = null,
    val e: OpValue<String>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) = StringSetType.op(op,  dataProvider(key) as Set<String>?, other?.real(dataProvider), e?.real(dataProvider), num?.real(dataProvider))
}

@Serializable
@SerialName(IType.Type_DateTimeSet)
class DateTimeSetExpression(
    val key: String,
    val op: String,
    val other: OpValue<Set<LocalDateTime>>? = null,
    val e: OpValue<LocalDateTime>? = null,//key所在变量集中是否包含e
    val num: OpValue<Int>? = null //key所在变量集与other交集元素个事 与num比较
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?) = DateTimeSetType.op(op,  dataProvider(key) as Set<LocalDateTime>?, other?.real(dataProvider), e?.real(dataProvider), num?.real(dataProvider))
}


val ruleRuntimeExprSerializersModule = SerializersModule {
    polymorphic(LogicalExpr::class){
        subclass(BoolExpression::class)
        subclass(IntExpression::class)
        subclass(LongExpression::class)
        subclass(DoubleExpression::class)
        subclass(StringExpression::class)
        subclass(DatetimeExpression::class)
        subclass(IntSetExpression::class)
        subclass(LongSetExpression::class)
        subclass(DoubleSetExpression::class)
        subclass(StringSetExpression::class)
        subclass(DateTimeSetExpression::class)
        subclass(ComplexExpression::class)
        subclass(MyExtendExpression::class)
    }
}
