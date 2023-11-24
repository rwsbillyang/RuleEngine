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

package com.github.rwsbillyang.rule.runtime

import java.time.LocalDateTime

/**
 * 数据类型接口，子类需实现
 * 1.支持的操作符
 * 2.计算
 * */
interface IType<T>
{
    val label: String
    //最终用于创建ParamType中的code，在前端paramType.code被赋值给LogicalExpr子类的_class,
    //也就是expr的SerialName被反序列化时，正确得到对应的子类表达式
    val code: String
    fun supportOperators(): List<String>
    companion object{
        const val Type_Bool = "Bool" // 将用于各子类表达式的SerialName，以及数据库记录ParamType的code字段
        const val Type_Int = "Int" //("整数"),
        const val Type_Long = "Long" // ("长整数"),
        const val Type_Double = "Double" //("小数"),
        const val Type_String = "String" //("字符串"),
        const val Type_Datetime = "DateTime" //("日期"),
        const val Type_Complex= "Complex" //("集合"),
        const val Type_IntSet= "IntSet" //("集合"),
        const val Type_LongSet= "LongSet" //("集合"),
        const val Type_DoubleSet= "DoubleSet" //("集合"),
        const val Type_StringSet= "StringSet" //("集合"),
        const val Type_DateTimeSet= "DateTimeSet" //("集合"),
        const val Type_IntEnum= "IntEnum" //("整形枚举"),
        const val Type_LongEnum= "LongEnum" //("长整数枚举"),
        const val Type_DoubleEnum= "DoubleEnum" //("小数枚举"),
        const val Type_StringEnum= "StringEnum" //("字符串枚举"),
        const val Type_DateTimeEnum= "DateTimeEnum" //("日期枚举"),
        // const val Type_Object = "Object" //("对象"),
        // const val Type_Function = "Function" //("函数")
    }
}
abstract class BaseType<T>: IType<T> {
    /**
     * @param keyExtra key从dataProvider取值时，作为附属信息协助key取值
     * */
    abstract fun op(dataProvider: (key: String, keyExtra:String?) -> Any?, key: String, op: String, operands: Map<String, MiniOperand>, keyExtra: String? = null): Boolean
}

abstract class SysBasicType<T>: BaseType<T>() {
    override fun supportOperators() = EnumBasicOp.values().map { it.name }
    override fun op(dataProvider: (key: String, keyExtra:String?) -> Any?, key:String, op: String, operands: Map<String, MiniOperand>, keyExtra: String?)
    = op(op, key?.let { dataProvider(it, keyExtra) as T? },
        operands["other"]?.raw(dataProvider) as T? ,
        operands["start"]?.raw(dataProvider) as T?,
        operands["end"]?.raw(dataProvider) as T?,
        operands["set"]?.raw(dataProvider) as Set<T>?)
    abstract fun op(op: String, v0: T?, other: T? = null, start: T? = null, end: T? = null, set: Set<T>? = null): Boolean
}

abstract class CollectionType<Container: Collection<T>, T>: BaseType<T>() {
    override fun supportOperators() = EnumCollectionOp.values().map { it.name }
    override fun op(dataProvider: (key: String, keyExtra:String?) -> Any?, key:String, op: String, operands: Map<String, MiniOperand>, keyExtra: String?)
            = op(op, key?.let { dataProvider(it, keyExtra) as Container? },
        operands["other"]?.raw(dataProvider) as Container? ,
        operands["e"]?.raw(dataProvider) as T?, //key所在变量集中是否包含e
        operands["num"]?.raw(dataProvider) as Int?) //key所在变量集与other交集元素个事 与num比较
    fun op(op: String, v0: Container?, other: Container? = null, e: T? = null, num: Int? = null):Boolean{
        if (v0 == null) throw Exception("${code}Type.${op}: no v0")
        return when(EnumCollectionOp.valueOf(op)){
            EnumCollectionOp.onlyContains ->  {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                v0.size == other.size && v0.intersect(other).size == v0.size
            }
            EnumCollectionOp.contains -> {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                 v0.contains(e)
            }
            EnumCollectionOp.notContains -> {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                !v0.contains(e)
            }
            EnumCollectionOp.containsAll -> {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                v0.containsAll(other)
            }
            EnumCollectionOp.anyIn ->  {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                v0.intersect(other).isNotEmpty()
            }
            EnumCollectionOp.numberIn ->  {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                if(num == null)throw Exception("${code}Type.${op}: no num")
                v0.intersect(other).size == num
            }
            EnumCollectionOp.gteNumberIn -> {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                if(num == null)throw Exception("${code}Type.${op}: no num")
                v0.intersect(other).size >= num
            }
            EnumCollectionOp.lteNumberIn ->  {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                if(num == null)throw Exception("${code}Type.${op}: no num")
                v0.intersect(other).size <= num
            }
            EnumCollectionOp.allIn ->  {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                other.containsAll(v0)
            }
            EnumCollectionOp.allNotIn ->  {
                if (other == null) throw Exception("${code}Type.${op}: no other")
                !other.containsAll(v0)
            }
        }
    }
}

object BoolType: SysBasicType<Boolean>(){
    override val label = "布尔"
    override val code = IType.Type_Bool
    override fun supportOperators() = listOf(EnumBasicOp.eq.name)
    override fun op(op: String, v0: Boolean?, other: Boolean?, start: Boolean?, end: Boolean?, set: Set<Boolean>?):Boolean{
        if(v0 == null) throw Exception("BoolType: no v0")
        return when(EnumBasicOp.valueOf(op)){
            EnumBasicOp.eq -> v0 == other
            else -> throw Exception("BoolType not support operator: $op")
        }
    }
}

object IntType: SysBasicType<Int>() {
    override val label = "整数"
    override val code = IType.Type_Int
    override fun op(op: String, v0: Int?, other: Int?, start: Int?, end: Int?, set: Set<Int>?): Boolean{
        if (v0 == null) throw Exception("${code}Type.${op}: no v0")
        return when (EnumBasicOp.valueOf(op)) {
            EnumBasicOp.eq -> {
                if (other == null) throw Exception("${code}Type.eq: no other")
                v0 == other
            }
            EnumBasicOp.ne -> {
                if (other == null) throw Exception("${code}Type.ne: no other")
                v0 != other
            }
            EnumBasicOp.gt -> {
                if (other == null) throw Exception("${code}Type.gt: no other")
                v0 > other
            }
            EnumBasicOp.gte -> {
                if (other == null) throw Exception("${code}Type.gte: no other")
                v0 >= other
            }
            EnumBasicOp.lt -> {
                if (other == null) throw Exception("${code}Type.lt: no other")
                v0 < other
            }
            EnumBasicOp.lte -> {
                if (other == null) throw Exception("${code}Type.lte: no other")
                v0 <= other
            }
            EnumBasicOp.between -> {
                if (start == null) throw Exception("${code}Type.between: no start")
                if (end == null) throw Exception("${code}Type.between: no end")
                v0 >= start && v0 <= end
            }
            EnumBasicOp.notBetween -> {
                if (start == null) throw Exception("${code}Type.notBetween: no start")
                if (end == null) throw Exception("${code}Type.notBetween: no end")
                v0 < start || v0 > end
            }
            EnumBasicOp.`in` -> {
                if (set == null) throw Exception("${code}Type.in: no set")
                set.contains(v0)//单个元素存在于集合中
            }
            EnumBasicOp.nin -> {
                if (set == null) throw Exception("${code}Type.nin: no set")
                !set.contains(v0)//单个元素不存在于集合中
            }
        }
    }
}


object DoubleType: SysBasicType<Double>() {
    override val label = "小数"
    override val code = IType.Type_Double
    override fun op(op: String, v0: Double?, other: Double?, start: Double?, end: Double?, set: Set<Double>?): Boolean{
        if (v0 == null) throw Exception("${code}Type.${op}: no v0")
        return when (EnumBasicOp.valueOf(op)) {
            EnumBasicOp.eq -> {
                if (other == null) throw Exception("${code}Type.eq: no other")
                v0 == other
            }
            EnumBasicOp.ne -> {
                if (other == null) throw Exception("${code}Type.ne: no other")
                v0 != other
            }
            EnumBasicOp.gt -> {
                if (other == null) throw Exception("${code}Type.gt: no other")
                v0 > other
            }
            EnumBasicOp.gte -> {
                if (other == null) throw Exception("${code}Type.gte: no other")
                v0 >= other
            }
            EnumBasicOp.lt -> {
                if (other == null) throw Exception("${code}Type.lt: no other")
                v0 < other
            }
            EnumBasicOp.lte -> {
                if (other == null) throw Exception("${code}Type.lte: no other")
                v0 <= other
            }
            EnumBasicOp.between -> {
                if (start == null) throw Exception("${code}Type.between: no start")
                if (end == null) throw Exception("${code}Type.between: no end")
                v0 >= start && v0 <= end
            }
            EnumBasicOp.notBetween -> {
                if (start == null) throw Exception("${code}Type.notBetween: no start")
                if (end == null) throw Exception("${code}Type.notBetween: no end")
                v0 < start || v0 > end
            }
            EnumBasicOp.`in` -> {
                if (set == null) throw Exception("${code}Type.in: no set")
                set.contains(v0)//单个元素存在于集合中
            }
            EnumBasicOp.nin -> {
                if (set == null) throw Exception("${code}Type.nin: no set")
                !set.contains(v0)//单个元素不存在于集合中
            }
        }
    }
}

object LongType: SysBasicType<Long>() {
    override val label = "长整数"
    override val code = IType.Type_Long
    override fun op(op: String, v0: Long?, other:Long?, start: Long?, end: Long?, set: Set<Long>?): Boolean{
        if (v0 == null) throw Exception("${code}Type.${op}: no v0")
        return when (EnumBasicOp.valueOf(op)) {
            EnumBasicOp.eq -> {
                if (other == null) throw Exception("${code}Type.eq: no other")
                v0 == other
            }
            EnumBasicOp.ne -> {
                if (other == null) throw Exception("${code}Type.ne: no other")
                v0 != other
            }
            EnumBasicOp.gt -> {
                if (other == null) throw Exception("${code}Type.gt: no other")
                v0 > other
            }
            EnumBasicOp.gte -> {
                if (other == null) throw Exception("${code}Type.gte: no other")
                v0 >= other
            }
            EnumBasicOp.lt -> {
                if (other == null) throw Exception("${code}Type.lt: no other")
                v0 < other
            }
            EnumBasicOp.lte -> {
                if (other == null) throw Exception("${code}Type.lte: no other")
                v0 <= other
            }
            EnumBasicOp.between -> {
                if (start == null) throw Exception("${code}Type.between: no start")
                if (end == null) throw Exception("${code}Type.between: no end")
                v0 >= start && v0 <= end
            }
            EnumBasicOp.notBetween -> {
                if (start == null) throw Exception("${code}Type.notBetween: no start")
                if (end == null) throw Exception("${code}Type.notBetween: no end")
                v0 < start || v0 > end
            }
            EnumBasicOp.`in` -> {
                if (set == null) throw Exception("${code}Type.in: no set")
                set.contains(v0)//单个元素存在于集合中
            }
            EnumBasicOp.nin -> {
                if (set == null) throw Exception("${code}Type.nin: no set")
                !set.contains(v0)//单个元素不存在于集合中
            }
        }
    }
}

object StringType: SysBasicType<String>() {
    override val label = "字符串"
    override val code = IType.Type_String
    override fun op(op: String, v0: String?, other:String?, start: String?, end: String?, set: Set<String>?): Boolean{
        if (v0 == null) throw Exception("${code}Type.${op}: no v0")
        return when (EnumBasicOp.valueOf(op)) {
            EnumBasicOp.eq -> {
                if (other == null) throw Exception("${code}Type.eq: no other")
                v0 == other
            }
            EnumBasicOp.ne -> {
                if (other == null) throw Exception("${code}Type.ne: no other")
                v0 != other
            }
            EnumBasicOp.gt -> {
                if (other == null) throw Exception("${code}Type.gt: no other")
                v0 > other
            }
            EnumBasicOp.gte -> {
                if (other == null) throw Exception("${code}Type.gte: no other")
                v0 >= other
            }
            EnumBasicOp.lt -> {
                if (other == null) throw Exception("${code}Type.lt: no other")
                v0 < other
            }
            EnumBasicOp.lte -> {
                if (other == null) throw Exception("${code}Type.lte: no other")
                v0 <= other
            }
            EnumBasicOp.between -> {
                if (start == null) throw Exception("${code}Type.between: no start")
                if (end == null) throw Exception("${code}Type.between: no end")
                v0 >= start && v0 <= end
            }
            EnumBasicOp.notBetween -> {
                if (start == null) throw Exception("${code}Type.notBetween: no start")
                if (end == null) throw Exception("${code}Type.notBetween: no end")
                v0 < start || v0 > end
            }
            EnumBasicOp.`in` -> {
                if (set == null) throw Exception("${code}Type.in: no set")
                set.contains(v0)//单个元素存在于集合中
            }
            EnumBasicOp.nin -> {
                if (set == null) throw Exception("${code}Type.nin: no set")
                !set.contains(v0)//单个元素不存在于集合中
            }
        }
    }
}


object DateTimeType: SysBasicType<LocalDateTime>() {
    override val label = "日期时间"
    override val code = IType.Type_Datetime
    override fun op(op: String, v0: LocalDateTime?, other:LocalDateTime?, start: LocalDateTime?,end: LocalDateTime?, set: Set<LocalDateTime>?): Boolean{
        if (v0 == null) throw Exception("${code}Type.${op}: no v0")
        return when (EnumBasicOp.valueOf(op)) {
            EnumBasicOp.eq -> {
                if (other == null) throw Exception("${code}Type.eq: no other")
                v0 == other
            }
            EnumBasicOp.ne -> {
                if (other == null) throw Exception("${code}Type.ne: no other")
                v0 != other
            }
            EnumBasicOp.gt -> {
                if (other == null) throw Exception("${code}Type.gt: no other")
                v0 > other
            }
            EnumBasicOp.gte -> {
                if (other == null) throw Exception("${code}Type.gte: no other")
                v0 >= other
            }
            EnumBasicOp.lt -> {
                if (other == null) throw Exception("${code}Type.lt: no other")
                v0 < other
            }
            EnumBasicOp.lte -> {
                if (other == null) throw Exception("${code}Type.lte: no other")
                v0 <= other
            }
            EnumBasicOp.between -> {
                if (start == null) throw Exception("${code}Type.between: no start")
                if (end == null) throw Exception("${code}Type.between: no end")
                v0 >= start && v0 <= end
            }
            EnumBasicOp.notBetween -> {
                if (start == null) throw Exception("${code}Type.notBetween: no start")
                if (end == null) throw Exception("${code}Type.notBetween: no end")
                v0 < start || v0 > end
            }
            EnumBasicOp.`in` -> {
                if (set == null) throw Exception("${code}Type.in: no set")
                set.contains(v0)//单个元素存在于集合中
            }
            EnumBasicOp.nin -> {
                if (set == null) throw Exception("${code}Type.nin: no set")
                !set.contains(v0)//单个元素不存在于集合中
            }
        }
    }
}


object IntSetType: CollectionType<Set<Int>, Int>() {
    override val label = "整数集合"
    override val code = IType.Type_IntSet
}
object LongSetType: CollectionType<Set<Long>, Long>() {
    override val label = "长整数集合"
    override val code = IType.Type_LongSet
}
object DoubleSetType: CollectionType<Set<Double>, Double>() {
    override val label = "小数集合"
    override val code = IType.Type_DoubleSet
}
object StringSetType: CollectionType<Set<String>, String>() {
    override val label = "字符串集合"
    override val code = IType.Type_StringSet
}
object DateTimeSetType: CollectionType<Set<LocalDateTime>, LocalDateTime>() {
    override val label = "日期集合"
    override val code = IType.Type_DateTimeSet
}