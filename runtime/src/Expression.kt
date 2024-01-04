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
import java.time.LocalDateTime



//@Serializable
//sealed class ITriLogicalExpr{ //不支持扩展，不支持多层次继承
//    abstract fun eval(dataProvider: (String) -> Any?): Boolean
//}
//在sealed class与具体子类之间，多加了一个类层次，导致反序列化时报错：
//JsonDecodingException: Polymorphic serializer was not found for class discriminator
//@Serializable
//@SerialName("Basic")
//abstract class BasicExpression: ITriLogicalExpr(){
//    abstract val key: String
//    abstract val op: String
//}


//@Serializable
//abstract class ITriLogicalExpr{
//    abstract fun eval(dataProvider: (String) -> Any?): Boolean
//}

/**
 * 使用interface代替sealed class可进行外部扩展，
 * 但需要定义SerializersModule进行polymorphic，且序列化时需将变量声明为接口类型
 * 参见：https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/polymorphism.md#open-polymorphism
 * */
interface ILogicalExpr{
    fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?): Boolean
    fun humanReadString(): String
}
interface ITriLogicalExpr: ILogicalExpr{
    val key: String
    val op: String
    val operands: Map<String, Operand>
    override fun humanReadString() = "$key $op ${operands.values.joinToString(" ") { it.humanReadString() }}"
}

object TrueExpression: ILogicalExpr{
    override fun eval(dataProvider: (key: String, keyExtra: String?) -> Any?) = true
    override fun humanReadString() = "True forever"
}
object FalseExpression: ILogicalExpr{
    override fun eval(dataProvider: (key: String, keyExtra: String?) -> Any?) = false
    override fun humanReadString() = "False forever"
}
@Serializable
@SerialName(IType.Type_Bool)
class BoolExpression(
    override val key: String,
    override val op: String,
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        BoolType.op(dataProvider, key, op, operands)
}

@Serializable
@SerialName(IType.Type_Int)
class IntExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        IntType.op(dataProvider, key, op, operands)
}


@Serializable
@SerialName(IType.Type_Long)
class LongExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        LongType.op(dataProvider, key, op, operands)
}

@Serializable
@SerialName(IType.Type_Double)
class DoubleExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        DoubleType.op(dataProvider, key, op, operands)
}


@Serializable
@SerialName(IType.Type_String)
class StringExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        StringType.op(dataProvider, key, op, operands)
}


@Serializable
@SerialName(IType.Type_Datetime)
class DatetimeExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        DateTimeType.op(dataProvider, key, op, operands)
}

@Serializable
@SerialName(IType.Type_IntSet)
class IntSetExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        IntSetType.op(dataProvider, key, op, operands)
}

@Serializable
@SerialName(IType.Type_LongSet)
class LongSetExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        LongSetType.op(dataProvider, key, op, operands)
}

@Serializable
@SerialName(IType.Type_DoubleSet)
class DoubleSetExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        DoubleSetType.op(dataProvider, key, op, operands)
}

@Serializable
@SerialName(IType.Type_StringSet)
class StringSetExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        StringSetType.op(dataProvider, key, op, operands)
}

@Serializable
@SerialName(IType.Type_DateTimeSet)
class DateTimeSetExpression(
    override val key: String,
    override val op: String,
    //各种other、start、end、set、e、num等固定名称和类型的操作数，
    // 由map代替，并且可以是其它任何数据类型，由操作码执行场景取操作数并转换为所需任何类型，
    // 但前提是必须在OpEnum中正确描述了配置map
    override val operands: Map<String, Operand>
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        DateTimeSetType.op(dataProvider, key, op, operands)
}



