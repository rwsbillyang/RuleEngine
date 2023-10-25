/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-10-23 20:14
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
 * @param label 操作符名称
 * @param remark 操作符备注
 * @param operandCfgMap 操作符的操作数配置
 * */
interface IExtOpEnum: IEnumOp{
    val label: String
    val remark: String?
    val operandCfgMap: Map<String, OperandConfig>
}

/**
 * @param op 操作符
 * @param operands 操作数
 * */
interface IExtExpr: LogicalExpr {
    val op: String
    val operands: Map<String, Operand>
}
