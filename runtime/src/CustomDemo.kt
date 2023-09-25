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

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable


/**
 * 自定义自己的表达式
 * */
@Serializable
@SerialName("mytypeXXX")
class MyExtendExpression(
    val key: String,
    val op: String,
    //val value: User? == null // Any_value_type_can_be_serialized. eg: User
): LogicalExpr(){
    override fun eval(dataPicker: (String) -> Any?) = when(op){
        "isVip" -> {
            //val v0 = map[key] as User? // Any_value_type_can_be_serialized?
            //v0.isVip()
            false
        }
        "olderThan" -> {
            //val v0 = map[key] as User? // Any_value_type_can_be_serialized?
            //if(v0 == null || value == null) false else v0.age >= value.age
            false
        }
        "above" -> {
            //val v0 = map[key] as User? // Any_value_type_can_be_serialized?
            //if(v0 == null || value == null) false else v0.age >= value
            false
        }
        else -> {
            throw Exception("MyExtendExpression not support operator: $op")
        }
    }
}

