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
import com.github.rwsbillyang.rule.runtime.JsonValue

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.UseContextualSerialization
import java.time.LocalDateTime

@Serializable
sealed class ExpressionMeta

@Serializable
@SerialName("Basic")
class BasicExpressionMeta(
    val paramId: Int,
    val param: Param? = null,
    val opId: Int,
    val op: Opcode? = null,
    val paramTypeId: Int? = null,
    val paramType: ParamType? = null,
    val mapKey: String? = null,
    val extra: String? = null,
    val operandMetaObj: Map<String, OperandValueMeta >? = null
): ExpressionMeta()

@Serializable
@SerialName(IType.Type_Complex)
class ComplexExpressionMeta(
    val opId: Int,
    val op: Opcode,
    val metaList: List<ExpressionMeta>
): ExpressionMeta()

@Serializable
class OperandValueMeta(
    val valueType: String , //"Param" | "Constant" | "JsonValue" | undefined
    val paramId: Int? = null,
    val param: Param? = null,
    //val constantIds: Int? = null, //无法与前端对应起来，前端各种类型都有：string | number | (string | number)[] | (string | number)[][] '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
    //val constantIdsStr: String? = null,
    val jsonValue: JsonValue? = null
)

//fun expressionMeta2Expr(metaStr: String?): LogicalExpr? {
//    if(metaStr == null) return null
//    val meta: ExpressionMeta = MySerializeJson.decodeFromString(metaStr)
//    return when(meta){
//        is BasicExpressionMeta -> {
//            meta.toExpr()
//        }
//        is ComplexExpressionMeta -> {
//            meta.toExpr()
//        }
//
//    }
//}
