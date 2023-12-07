/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-11-25 21:59
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

import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.polymorphic
import kotlinx.serialization.modules.subclass

val ruleRuntimeExprSerializersModule = SerializersModule {
    polymorphic(ILogicalExpr::class){
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
    }
    polymorphic(Operand::class){
        subclass(BoolValue::class)
        subclass(IntValue::class)
        subclass(LongValue::class)
        subclass(DoubleValue::class)
        subclass(StringValue::class)
        subclass(LocalDateTimeValue::class)
        subclass(IntSetValue::class)
        subclass(LongSetValue::class)
        subclass(DoubleSetValue::class)
        subclass(StringSetValue::class)
        subclass(LocalDateTimeSetValue::class)
        subclass(LabelIntEnumValue::class)
        subclass(LabelLongEnumValue::class)
        subclass(LabelDoubleEnumValue::class)
        subclass(LabelStringEnumValue::class)
        subclass(LabelLocalDateTimeEnumValue::class)
        subclass(VariableValue::class)
    }
}