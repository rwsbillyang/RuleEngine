/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-09-25 09:03
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

interface IEnumOp

val otherCfg = OperandConfig("值", "与另一个值other比较")
/**
 * 基本操作符
 * */
enum class EnumBasicOp(val label: String, val operandMap: Map<String, OperandConfig>):IEnumOp  {
    eq("等于", mapOf("other" to otherCfg)),
    ne("不等于", mapOf("other" to otherCfg)),
    gt("大于", mapOf("other" to otherCfg)),
    gte("大于或等于", mapOf("other" to otherCfg)),
    lt("小于", mapOf("other" to otherCfg)),
    lte("小于或等于", mapOf("other" to otherCfg)),

    between("区间范围", mapOf(
        "start" to OperandConfig("起始值", "范围比较[start, end]"),
        "end" to OperandConfig("终止值", "范围比较[start, end]")
    )),
    notBetween("不在区间范围",mapOf(
        "start" to OperandConfig("起始值", "范围比较[start, end]"),
        "end" to OperandConfig("终止值", "范围比较[start, end]")
    )),
    `in`("存在于", mapOf("set" to OperandConfig("集合", "单个元素 '存在于' 集合set中", true))),//单个元素存在于集合中
    nin("不存在于",  mapOf("set" to OperandConfig("集合", "单个元素 '不存在' 于集合set中", true))),//单个元素不存在于集合中

    //regexp("正则")
}

/**
 * 集合容器操作符
 * */
enum class EnumCollectionOp (val label: String, val operandMap: Map<String, OperandConfig>):IEnumOp {
    onlyContains("只包含（等于）", mapOf("other" to OperandConfig("集合", "集合所包含元素相同，即等于", true)) ),
    contains("包含某元素", mapOf("e" to OperandConfig("元素e", "是否包含某个元素e"))),
    notContains("不包含某元素", mapOf("e" to OperandConfig("元素e", "是否不包含某个元素e"))),
    containsAll("包含全部", mapOf("other" to OperandConfig("集合", "集合包含所有other的元素，即other是子集", true))),
    anyIn("任意一个存在于", mapOf("other" to OperandConfig("集合", "任意元素存在于集合other中，任意一个元素存在于other中，即交集非空", true))),//即numberOfIn > 0
    numberIn("有几个存在于",  mapOf("other" to OperandConfig("集合", "有num个元素存在于集合other中", true), "num" to OperandConfig("num", "两个集合交集中的元素是num个",false, true, IType.Type_Int))),
    gteNumberIn("至少几个存在于", mapOf("other" to OperandConfig("集合", "有num个元素存在于集合other中", true), "num" to OperandConfig("num", "两个集合交集中的元素不小于num个",false, true,  IType.Type_Int))),//集合v0存在于集合v1中的元素数量
    lteNumberIn("至多几个存在于", mapOf("other" to OperandConfig("集合", "有num个元素存在于集合other中", true), "num" to OperandConfig("num", "两个集合交集中的元素不大于num个",false, true,  IType.Type_Int))),//集合v0存在于集合v1中的元素数量
    allIn("都存在于",  mapOf("other" to OperandConfig("集合", "元素全部元素存在于集合other中, 是other的子集", true))),//元素全部元素存在于集合中，即是子集 即numberOfIn == sizeOf(collection1)
    allNotIn("都不存在于",  mapOf("other" to OperandConfig("集合", "元素全部元素都不存在于集合other中，二者无交集", true))),
}

/**
 * 表达式的逻辑运算符
 * */
enum class EnumLogicalOp(val label: String, val remark: String? = null):IEnumOp {
    or("或者", "逻辑或(OR)"),
    and("并且", "逻辑且(AND)"),
    none("均非", "逻辑都不是(All NOT)"),
}
