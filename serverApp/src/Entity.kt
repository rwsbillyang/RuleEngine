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

package com.github.rwsbillyang.rule.composer



import com.github.rwsbillyang.ruleEngine.core.expression.LogicalExpr
import kotlinx.serialization.*
import org.komapper.annotation.*
import org.komapper.core.dsl.Meta


/**
 * 变量基础类型，如数值、字符串、日期、布尔等
 * @param label 变量类型字符串
 * @param isSys 若是系统内置不可编辑
 */
@Serializable
@KomapperEntity
@KomapperTable("t_param_type")
data class ParamType(
    val label: String,
    val code: String,
    val supportOpIds: String, //,分隔的operator id
    val isBasic: Boolean,//基本类型
    val isSys: Boolean = true, //是否内置 当前都为true
    @KomapperId @KomapperAutoIncrement
    val id: Int? = null,

    @KomapperIgnore var supportOps: List<Operator>? = null //supportOpIds
){
    fun toBean(service: BaseCrudService){
        supportOps = supportOpIds.split(",").mapNotNull{service.findOne(Meta.operator, {Meta.operator.id eq it.toInt()}, "op/${it}")}
    }
}

/**
 * 操作符, 如>,>=, <, <=, !=, ==, in, between
 * @param name 操作符
 * @param isSys 若是系统内置不可编辑
 */
@Serializable
@KomapperEntity
@KomapperTable("t_operator")
data class Operator(
    val label: String,
    val code: String,
    val remark: String? = null, //备注
    val isSys: Boolean = true,
    @KomapperId @KomapperAutoIncrement
    val id: Int? = null
)

/**
 * 值常量
 * @param typeId ParameterType.id
 * @param jsonValue 常量值
 * {"isEnum":true,"label":"天干","jsonValue":{"_class":"String","value":["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]},"typeId":1}
 */
@Serializable
@KomapperEntity
@KomapperTable("t_constant")
data class Constant(
    val label: String,
    var typeId: Int?=null,
    var value: String? = null, //back field json of JsonValue
    val isEnum: Boolean = false, //是否是枚举
    val remark: String? = null,//备注
    val domainId: Int? = null, //domain.id

    @KomapperId @KomapperAutoIncrement
    val id: Int? = null,

    @KomapperIgnore var paramType: ParamType? = null, //typeId 前端列表中需要使用该信息
    @KomapperIgnore var domain: Domain? = null, //domainId 前端列表中需要使用该信息
    @KomapperIgnore @Contextual var jsonValue: JsonValue? = null
){
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
        paramType = service.findOne(Meta.paramType, {Meta.paramType.id eq typeId}, "paramType/${typeId}")
        if(jsonValue == null && value != null) jsonValue = MySerializeJson.decodeFromString(value!!)
    }
    // 若注释掉，则前端保存时负责提供相应字符串的值
//    fun toEntity(){
//        if(jsonValue != null) {
//            value = MySerializeJson.encodeToString(jsonValue!!)
//        }
//    }
}


/**
 * 参数变量
 * @param mapKey engine用于从map中取值
 * @param type 参数变量类型
 */
@Serializable
@KomapperEntity
@KomapperTable("t_param")
data class Param(
    val label: String,
    val typeId: Int,
    val mapKey: String,
    val remark: String? = null,//备注
    val domainId: Int? = null, //domain.id
    val valueScopeIds: String? = null, //值范围来自哪些常量的id
    @KomapperId @KomapperAutoIncrement
    val id: Int? = null,

    @KomapperIgnore var paramType: ParamType? = null, //typeId
    @KomapperIgnore var domain: Domain? = null, //domainId
    @KomapperIgnore var valueScopes: List<Constant>? = null
){
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
        paramType = service.findOne(Meta.paramType, {Meta.paramType.id eq typeId}, "paramType/${typeId}")
        if(valueScopeIds != null) valueScopes = valueScopeIds.split(",").mapNotNull{service.findOne(Meta.constant, {Meta.constant.id eq it.toInt()} ,"constant/${it}")}
    }
}




/**
 * 表达式，构成规则的条件
 * @param key 用于从map中取值
 * @param op 操作符
 * @param value 值
 * @param valueType 参数变量类型
 */

@Serializable
@KomapperEntity
@KomapperTable("t_expression")
data class Expression(
    @KomapperId @KomapperAutoIncrement
    val id: Int? = null,
    val label: String,
    val type: String, //basic or complex
    var exprStr: String? = null,//back field of json of Expression
    var metaStr: String? = null,//back field of json of ExpressionMeta
    val remark: String? = null, //备注
    val domainId: Int? = null, //domain.id
    @KomapperIgnore var domain: Domain? = null,
    //@KomapperIgnore @Contextual var expr : LogicalExpr? = null,//值
    //@KomapperIgnore @Contextual var meta: ExpressionMeta? = null//json of ExpressionMeta
){
    //数据库中的字段转换成给前端展示需要的字段
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
        //if(expr == null && exprStr != null) expr = MySerializeJson.decodeFromString(exprStr!!)
        //if(meta == null && metaStr != null) meta = MySerializeJson.decodeFromString(metaStr!!)
    }
    //前端提交的数据转换一下，赋值给要保存到数据库中的字段  若注释掉，则前端保存时负责提供相应字符串的值
//    fun toEntity(){
//        if(expr != null) exprStr = MySerializeJson.encodeToString(expr!!)
//        if(meta != null) metaStr = MySerializeJson.encodeToString(meta!!)
//    }
}



/**
 * 领域，不同的领域有不同的参数变量及规则，用于区分整个数据
 * @param key engine用于从map中取值
 * @param label
 */
@Serializable
@KomapperEntity
@KomapperTable("t_domain")
data class Domain(
    val label: String,
    @KomapperId @KomapperAutoIncrement
    val id: Int? = null
)


@Serializable
@KomapperEntity
@KomapperTable("t_rule")
data class Rule(
    // 前端填写，用于确定是添加还是更新
    @KomapperIgnore val isAdd:Boolean? = null, //id由前端按一定算法生成，不再用id是否为空来判断添加还是更新

    @KomapperId
    val id: String, //md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
    val label: String? = null,
    val priority: Int? = null ,
    val remark: String? = null,
    val enable: Boolean = true,
    val tags: String? = null,
    val threshhold: Int? = null, //percent

    val exprId: Int? = null,//if exprId not null, use it 如果exprId非空，则exprStr和metaStr来自Expression记录；否则由前端编辑时提供
    val exprStr: String? = null,//json string of LogicalExpr
    val metaStr: String? = null,//json string of ExpressionMeta

    val thenAction: String? = null,// if do
    val elseAction: String? = null, //else do

    val domainId: Int? = null,
    @KomapperIgnore var domain: Domain? = null, //前端列表数据需要

    //@Contextual var expr : LogicalExpr? = null,//由exprStr解析或前端提供
    //@Contextual var meta: ExpressionMeta? = null//由metaStr解析或前端提供


    val ruleChildrenIds: String? = null, // json string of Rule.id List, insert/save one when create a child in front end
    @KomapperIgnore var ruleChildren: List<Rule>? = null,

    val ruleGroupChildrenIds: String? = null,// json string of RuleGroup.id List, insert one when create a child in front end
    @KomapperIgnore var ruleGroupChildren: List<RuleGroup>? = null
){
    fun setupChildren(service: BaseCrudService){
        if(ruleChildrenIds != null && ruleChildren == null){
            ruleChildren = ruleChildrenIds.split(",").mapNotNull{
                service.findOne(Meta.rule, {Meta.rule.id eq it}, "rule/${it}")?.apply { setupChildren(service) }
            }
        }
        if(ruleGroupChildrenIds != null && ruleGroupChildren == null){
            ruleGroupChildren = ruleGroupChildrenIds.split(",").mapNotNull{
                service.findOne(Meta.ruleGroup, {Meta.ruleGroup.id eq it}, "ruleGroup/${it}")?.apply { setupChildren(service) }
            }
        }
    }

    //数据库中的字段转换成给前端展示需要的字段
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
    }

    fun getExpr() = if(exprStr != null) MySerializeJson.decodeFromString<LogicalExpr>(exprStr) else null
    fun getExprMeta() = if(metaStr != null) MySerializeJson.decodeFromString<ExpressionMeta>(metaStr) else null

}

@Serializable
@KomapperEntity
@KomapperTable("t_rule_group")
data class RuleGroup(
    // 前端填写，用于确定是添加还是更新
    @KomapperIgnore val isAdd:Boolean? = null, //id由前端按一定算法生成，不再用id是否为空来判断添加还是更新

    @KomapperId
    val id: String, //md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
    val label: String,
    val exclusive: Boolean = true,

    val enable: Boolean = true,
    val tags: String? = null,
    val remark: String? = null,

    val priority: Int? = null ,
    val domainId: Int? = null,
    @KomapperIgnore var domain: Domain? = null,

    val ruleChildrenIds: String? = null, // json string of Rule.id List, insert/save one when create a child in front end
    @KomapperIgnore var ruleChildren: List<Rule>? = null,

    val ruleGroupChildrenIds: String? = null,// json string of RuleGroup.id List, insert one when create a child in front end
    @KomapperIgnore var ruleGroupChildren: List<RuleGroup>? = null
){
    fun setupChildren(service: BaseCrudService){
        if(ruleChildrenIds != null && ruleChildren == null){
            ruleChildren = ruleChildrenIds.split(",").mapNotNull{
                service.findOne(Meta.rule, {Meta.rule.id eq it}, "rule/${it}")?.apply { setupChildren(service) }
            }
        }
        if(ruleGroupChildrenIds != null && ruleGroupChildren == null){
            ruleGroupChildren = ruleGroupChildrenIds.split(",").mapNotNull{
                service.findOne(Meta.ruleGroup, {Meta.ruleGroup.id eq it}, "ruleGroup/${it}")?.apply { setupChildren(service) }
            }
        }
    }

    //数据库中的字段转换成给前端展示需要的字段
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it})}

        setupChildren(service)
    }
}

@Serializable
@KomapperEntity
@KomapperTable("t_rule_action")
data class RuleAction(
    val label: String? = null,
    val actionKey: String,
    val remark: String? = null,
    @KomapperId @KomapperAutoIncrement
    val id: Int? = null
)

