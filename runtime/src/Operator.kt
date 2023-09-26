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


/**
 * 基本操作符
 * */
enum class EnumOp(val label: String,
                  val other: Boolean = false,
                  val start: Boolean = false,
                  val end: Boolean = false,
                  val set: Boolean = false,
                  val e: Boolean = false,
                  val num: Boolean = false,
                  val remark: String? = null) {
    eq("等于", true),
    ne("不等于", true),
    gt("大于", true),
    gte("大于或等于", true),
    lt("小于", true),
    lte("小于或等于", true),

    between("区间范围",false, true, true),
    notBetween("不在区间范围",false, true, true),

    `in`("存在于", set = true, remark = "单个元素存在于集合中: 前者存在于后者中"),//单个元素存在于集合中
    nin("不存在于",  set = true, remark = "单个元素不存在于集合中：前者不存在于后者中"),//单个元素不存在于集合中

    //regexp("正则")
}

/**
 * 集合容器操作符
 * */
enum class EnumCollectionOp (val label: String,
                             val other: Boolean = false,
                             val start: Boolean = false,
                             val end: Boolean = false,
                             val set: Boolean = false,
                             val e: Boolean = false,
                             val num: Boolean = false,
                             val remark: String? = null){
    onlyContains("只包含（等于）", true, remark = "集合所包含元素相同"),
    contains("包含某元素", e = true, remark ="值集合包含某个元素：前者包含后者"),
    notContains("不包含某元素", e = true,  remark ="值集合不包含某个元素：前者不包含后者"),
    containsAll("包含全部", true, remark ="值集合包含所有元素：前者包含所有后者，即后者是前者子集"),
    anyIn("任意一个存在于", true,remark ="任意元素存在于集合中，前者任意一个元素存在于后者中，即交集非空"),//即numberOfIn > 0
    numberIn("有几个存在于",  true,num = true, remark ="两个集合交集中的元素是几个"),
    gteNumberIn("至少几个存在于",  num = true, remark ="两个集合交集中的元素不小于几"),//集合v0存在于集合v1中的元素数量
    lteNumberIn("至多几个存在于", true, num = true,remark ="两个集合交集中的元素不大于几"),//集合v0存在于集合v1中的元素数量
    allIn("都存在于",  true, remark ="元素全部元素存在于集合中: 前者都存在于后者中，即前者是后者子集"),//元素全部元素存在于集合中，即是子集 即numberOfIn == sizeOf(collection1)
    allNotIn("都不存在于", true, remark ="元素全部元素都不存在于集合中，前者任何一个元素都不出现于后者中，二者无交集"),
}

/**
 * 表达式的逻辑运算符
 * */
enum class EnumLogicalOp(val label: String, val remark: String? = null){
    or("或者", "逻辑或(OR)"),
    and("并且", "逻辑且(AND)"),
    none("均非", "逻辑都不是(All NOT)"),
}