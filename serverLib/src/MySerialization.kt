/*
 * ```
 * Copyright © 2024 rwsbillyang@qq.com.  All Rights Reserved.
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2024-04-22 16:13
 *
 * NOTICE:
 * This software is protected by China and U.S. Copyright Law and International Treaties.
 * Unauthorized use, duplication, reverse engineering, any form of redistribution,
 * or use in part or in whole other than by prior, express, printed and signed license
 * for use is subject to civil and criminal prosecution. If you have received this file in error,
 * please notify copyright holder and destroy this and any other copies as instructed.
 * ```
 */

package com.github.rwsbillyang.rule.composer

import com.github.rwsbillyang.ktorKit.ApiJson.apiJsonBuilder
import com.github.rwsbillyang.ktorKit.LocalDateTimeAsStringSerializer
import com.github.rwsbillyang.rule.runtime.ruleRuntimeExprSerializersModule
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.contextual
import kotlinx.serialization.modules.plus

//默认情况下enableJsonApi为true，使用的是LocalDateTimeAsLongSerializer and ObjectId64Serializer
val MySerializeJson = Json {
    apiJsonBuilder()
    serializersModule = SerializersModule {
        contextual(LocalDateTimeAsStringSerializer) //默认情况下enableJsonApi为true，使用的是LocalDateTimeAsLongSerializer and ObjectId64Serializer
    } + ruleRuntimeExprSerializersModule
}