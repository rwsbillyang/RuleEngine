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

package com.github.rwsbillyang.rule.runtime

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable

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
 * @param defaultOperandValueType 前端OperandMeta.valueType: "Param" | "Constant" | "JsonValue"
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
    val defaultOperandValueType: String? = null, //"Param" | "Constant" | "JsonValue"
    val enable: Boolean = true
)
@Serializable
class SelectOption<T>(val label: String, val value: T)

@Serializable
enum class OperandValueType{Param, Constant,JsonValue } //前端OperandMeta.valueType
/**
 * 操作数
 * @param name 操作数名称
 * @param typeCode 操作数类型code，null表示与变量类型一致
 * @param
 * */
@Serializable
class Operand(
    val valueType: OperandValueType,
    val key: String? = null, //key: other, start, end, set, e, number, if valueType == ValueType.Param then use key to pick a value
    @Contextual val value: Any? = null //else use value directly
){
    fun real(dataProvider: (key: String, keyExtra:String?) -> Any?, keyExtra: String? = null) = if(valueType == OperandValueType.Param && key != null){
        dataProvider(key, keyExtra)
    }else{
        value
    }
}

