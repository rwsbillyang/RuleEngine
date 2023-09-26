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

@file:UseContextualSerialization(LogicalExpr::class)

package com.github.rwsbillyang.rule.runtime

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.UseContextualSerialization


/**
 * 多个表达式(基本或复杂)经过逻辑运算构成的表达式
 * */
@Serializable
@SerialName(IType.Type_Complex)
class ComplexExpression(
    val op: String,
    val exprs: List<LogicalExpr>
): LogicalExpr {
    override fun eval(dataProvider: (String) -> Any?): Boolean{
        return when(EnumLogicalOp.valueOf(op)){
            EnumLogicalOp.and -> exprs.all { it.eval(dataProvider) }
            EnumLogicalOp.or -> exprs.any { it.eval(dataProvider) }
            EnumLogicalOp.none -> !(exprs.any { it.eval(dataProvider) })
        }
    }
}