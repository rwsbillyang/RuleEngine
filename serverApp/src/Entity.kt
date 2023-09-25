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



import com.github.rwsbillyang.rule.runtime.LogicalExpr
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

    val domainId: Int? = null,//自定义记录可以有domainId
    @KomapperIgnore var domain: Domain? = null, //domainId 前端列表中需要使用该信息

    @KomapperIgnore var supportOps: List<Operator>? = null //supportOpIds
){
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
        supportOps = supportOpIds.split(",").mapNotNull{service.findOne(Meta.operator, {Meta.operator.id eq it.toInt()}, "op/${it}")}
    }
}

/**
 * 操作数配置
 * */
@Serializable
class OperandConfig(
    val enable: Boolean,
    val valueScopeIds: String?, //enable激活后与typedId必须至少一个非空
    val typedId: Int?
)
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
    val type: String,
    val remark: String? = null, //备注
    val isSys: Boolean = true,

    //以下为操作数配置，需要的操作数则设置为true, 前端根据它是否展示对应的输入控件
    val other: Boolean= false, //如果空则表示前端不可见；
    val start: Boolean= false,//如果空则表示前端不可见；
    val end: Boolean= false,//如果空则表示前端不可见；
    val collection: Boolean= false,//set是数据库关键字
    val e: Boolean= false, //如果空则表示前端不可见；
    val num: Boolean = false,

    //自定义操作符的操作数所使用的常量类型或值域（常量id列表）
    val operandCfgStr: String? = null,

    val domainId: Int? = null,//自定义记录可以有domainId
    @KomapperIgnore var domain: Domain? = null, //domainId 前端列表中需要使用该信息

    @KomapperId @KomapperAutoIncrement
    val id: Int? = null
){
    companion object{
        const val Basic = "Basic"
        const val Collection = "Collection"
        const val Logical = "Logical"
        const val Customize = "Customize"
    }
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
    }
}
///**
// * 操作符类型
// * */
//enum class OpType{
//    Basic, Collection, Logical, Customize
//}

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
    //@KomapperIgnore @Contextual var jsonValue: JsonValue? = null
){
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
        paramType = service.findOne(Meta.paramType, {Meta.paramType.id eq typeId}, "paramType/${typeId}")
        //if(jsonValue == null && value != null) jsonValue = MySerializeJson.decodeFromString(value!!)
    }
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
    val categoryId: Int? = null,
    val valueScopeIds: String? = null, //值范围来自哪些常量的id
    @KomapperId @KomapperAutoIncrement
    val id: Int? = null,

    @KomapperIgnore var paramCategory: ParamCategory? = null, //categoryId
    @KomapperIgnore var paramType: ParamType? = null, //typeId
    @KomapperIgnore var domain: Domain? = null, //domainId
    @KomapperIgnore var valueScopes: List<Constant>? = null
){
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
        paramType = service.findOne(Meta.paramType, {Meta.paramType.id eq typeId}, "paramType/${typeId}")
        paramCategory = service.findOne(Meta.paramCategory, {Meta.paramCategory.id eq categoryId}, "paramCategory/${categoryId}")
        if(valueScopeIds != null) valueScopes = valueScopeIds.split(",").mapNotNull{service.findOne(Meta.constant, {Meta.constant.id eq it.toInt()} ,"constant/${it}")}
    }
}

@Serializable
@KomapperEntity
@KomapperTable("t_param_category")
data class ParamCategory(
    val label: String,
    val domainId: Int? = null, //domain.id
    @KomapperId @KomapperAutoIncrement
    val id: Int? = null,

    @KomapperIgnore var domain: Domain? = null,
    @KomapperIgnore var children: List<Param>? = null
){
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
    }
    fun setupChildren(service: BaseCrudService){
        children = service.findAll(Meta.param,  {
            Meta.param.categoryId eq id
            Meta.param.domainId eq domainId
        } ).onEach { it.toBean(service) }
    }
}


/**
 * 表达式，构成规则的条件
 * @param type 类型
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
    }
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

/**
 * 前端树形数据子列表
 * 前端树形列表数据统一使用公共字段RuleCommon，避免children既有Rule又有RuleGroup
 * */
@Serializable
class RuleCommon(
    val parentPath: List<String>, //此字段用于前端向上遍历找到父节点数据，根节点id在最前面，当前叶子节点id在最后
    val rule: Rule?,//RuleCommon自身是rule，也就是数据来源Rule
    val ruleGroup: RuleGroup?,//RuleCommon自身是RuleGroup，数据来源RuleGroup

    val id: Int?, // 不再使用这种方式：md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
    val typedId: String,//添加前缀rule和group用于区分类型，parentPath查找时区分类型，因添加的subrule or subruleGroup的id可能相同，且在同一个children中
    val level: Int?,
    val label: String?,
    val priority: Int? ,
    val remark: String?,
    val enable: Boolean ,
    val tags: String?,
    val exclusive: Boolean,
    val domainId: Int?,
    var domain: Domain? , //前端列表数据需要
    var children: List<RuleCommon> ? = null //为前端构造tree型列表展示，不再使用List<Rule>和List<RuleGroup>，让前端子列表统一
)


@Serializable
@KomapperEntity
@KomapperTable("t_rule")
data class Rule(
    @KomapperId @KomapperAutoIncrement
    val id: Int ? = null, //不再使用这种方式：md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
    val level: Int? = null,
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

    val exclusive: Boolean = false, //chidlren是否互斥

    val ruleChildrenIds: String? = null, // json string of Rule.id List, insert/save one when create a child in front end
    val ruleGroupChildrenIds: String? = null,// json string of RuleGroup.id List, insert one when create a child in front end

    var ruleParentIds: String? = null,
    var ruleGroupParentIds: String? = null,

    //@KomapperIgnore var ruleChildren: List<Rule>? = null,
    //@KomapperIgnore var ruleGroupChildren: List<RuleGroup>? = null,
    //@KomapperIgnore var children: MutableList<RuleCommon> ? = null //为前端构造tree型列表展示，不再使用List<Rule>和List<RuleGroup>，让前端子列表统一
){
    fun toRuleCommon(service: BaseCrudService?, path: MutableList<String>? = null): RuleCommon  {
        val pair = if(service != null)getChildrenTree(service, path) else Pair(listOf(), null) //在新增和鞭酒修改时无需构建children，因1是没有无需构建，2是修改时构建也是从当前节点开始的，不是从根节点开始的parentPath
        return RuleCommon(
            pair.first, this, null, id, "rule$id", level, label, priority, remark, enable, tags, exclusive, domainId,  domain, pair.second
        )
    }

    //数据库中的字段转换成给前端展示需要的字段
    fun getChildrenTree(service: BaseCrudService, path: MutableList<String>?): Pair<List<String>, List<RuleCommon>?>{
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it})}

        //为前端构造tree型列表展示
        val myPath = path?: mutableListOf() //顶级节点负责创建path
        myPath.add("rule$id")//将当前节点id添加进path，子节点中递归调用时，都将当前id加入，形成parentPath

        val list = myPath.toList()//记录下parentPath，相当于copy

        //为前端构造tree型列表展示
        if(!ruleChildrenIds.isNullOrEmpty() || !ruleGroupChildrenIds.isNullOrEmpty()){
            val children = mutableListOf<RuleCommon>()
            ruleChildrenIds?.split(",")?.mapNotNull{
                service.findOne(Meta.rule, {Meta.rule.id eq it.toInt()}, "rule/${it}")?.toRuleCommon(service, myPath)
            }?.forEach {
                children.add(it)
            }
            ruleGroupChildrenIds?.split(",")?.mapNotNull{
                service.findOne(Meta.ruleGroup, {Meta.ruleGroup.id eq it.toInt()}, "ruleGroup/${it}")?.toRuleCommon(service, myPath)
            }?.forEach {
                children.add(it)
            }

//            val log = LoggerFactory.getLogger("Rule")
//            log.info("id=$id, myPath:${list.joinToString(",")}")

            myPath.removeLast()//返回时出栈，从子节点中递归时删除当前，避免从子节点返回时，仍然在path中有子节点id
            return Pair(list, children.toList())
        }

        myPath.removeLast()//返回时出栈，从子节点中递归时删除当前，避免从子节点返回时，仍然在path中有子节点id
        return Pair(list, null)
    }

    fun getExpr() = if(exprStr != null) MySerializeJson.decodeFromString<LogicalExpr>(exprStr) else null
    fun getExprMeta() = if(metaStr != null) MySerializeJson.decodeFromString<ExpressionMeta>(metaStr) else null
}

@Serializable
@KomapperEntity
@KomapperTable("t_rule_group")
data class RuleGroup(
    @KomapperId @KomapperAutoIncrement
    val id: Int ? = null, //不再使用这种方式：md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
    val level: Int? = null,

    val label: String,
    val exclusive: Boolean = true,

    val enable: Boolean = true,
    val tags: String? = null,
    val remark: String? = null,

    val priority: Int? = null ,
    val domainId: Int? = null,
    @KomapperIgnore var domain: Domain? = null,

    val ruleChildrenIds: String? = null, // json string of Rule.id List, insert/save one when create a child in front end
    val ruleGroupChildrenIds: String? = null,// json string of RuleGroup.id List, insert one when create a child in front end

    var ruleParentIds: String? = null,
    var ruleGroupParentIds: String? = null,

    //@KomapperIgnore var ruleChildren: List<Rule>? = null,
    //@KomapperIgnore var ruleGroupChildren: List<RuleGroup>? = null,
){
    fun toRuleCommon(service: BaseCrudService?, path: MutableList<String>? = null): RuleCommon  {
        val pair = if(service != null)getChildrenTree(service, path) else Pair(listOf(), null) //在新增和鞭酒修改时无需构建children，因1是没有无需构建，2是修改时构建也是从当前节点开始的，不是从根节点开始的parentPath
        return RuleCommon(
            pair.first, null, this, id, "group$id", level, label, priority, remark, enable, tags, exclusive, domainId, domain, pair.second
        )
    }

    //数据库中的字段转换成给前端展示需要的字段
    fun getChildrenTree(service: BaseCrudService, path: MutableList<String>?): Pair<List<String>, List<RuleCommon>?>{
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it})}

        //为前端构造tree型列表展示
        val myPath = path?: mutableListOf() //顶级节点负责创建path
        myPath.add("group$id")//将当前节点id添加进path，子节点中递归调用时，都将当前id加入，形成parentPath

        val list = myPath.toList()//记录下parentPath，相当于copy

        //为前端构造tree型列表展示
        if(!ruleChildrenIds.isNullOrEmpty() || !ruleGroupChildrenIds.isNullOrEmpty()){
            val children = mutableListOf<RuleCommon>()
            ruleChildrenIds?.split(",")?.mapNotNull{
                service.findOne(Meta.rule, {Meta.rule.id eq it.toInt()}, "rule/${it}")?.toRuleCommon(service, myPath)
            }?.forEach {
                children.add(it)
            }
            ruleGroupChildrenIds?.split(",")?.mapNotNull{
                service.findOne(Meta.ruleGroup, {Meta.ruleGroup.id eq it.toInt()}, "ruleGroup/${it}")?.toRuleCommon(service, myPath)
            }?.forEach {
                children.add(it)
            }

//            val log = LoggerFactory.getLogger("Rule")
//            log.info("id=$id, myPath:${list.joinToString(",")}")

            myPath.removeLast()//返回时出栈，从子节点中递归时删除当前，避免从子节点返回时，仍然在path中有子节点id
            return Pair(list, children.toList())
        }

        myPath.removeLast()//返回时出栈，从子节点中递归时删除当前，避免从子节点返回时，仍然在path中有子节点id
        return Pair(list, null)
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

