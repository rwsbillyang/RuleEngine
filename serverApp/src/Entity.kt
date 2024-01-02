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



import com.github.rwsbillyang.rule.runtime.ILogicalExpr
import kotlinx.serialization.*
import org.komapper.annotation.*
import org.komapper.core.dsl.Meta
import org.komapper.core.dsl.expression.SortExpression
import org.komapper.core.dsl.operator.desc


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
    val supportOpIds: String, //,分隔的opcode id
    val type: String,// Basic, Set, Ext,
    val isSys: Boolean = true, //是否内置 当前都为true
    val domainId: Int? = null,//自定义记录可以有domainId

    @KomapperId @KomapperAutoIncrement
    val id: Int? = null,

    @KomapperIgnore var domain: Domain? = null, //domainId 前端列表中需要使用该信息
    @KomapperIgnore var supportOps: List<Opcode>? = null //supportOpIds
){
    companion object{
        const val Basic = "Basic"
        const val Collection = "Collection"
        const val Ext = "Ext"
        const val Customize = "Customize"
    }
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
        supportOps = supportOpIds.split(",").mapNotNull{service.findOne(Meta.opcode, {Meta.opcode.id eq it.toInt()}, "op/${it}")}
    }
}


/**
 * 操作符, 如>,>=, <, <=, !=, ==, in, between
 * @param name 操作符
 * @param isSys 若是系统内置不可编辑
 */
@Serializable
@KomapperEntity
@KomapperTable("t_opcode")
data class Opcode(
    val label: String,
    val code: String, //opcode
    val type: String, // 操作数类型，用于select中的过滤

    //自定义操作符的操作数配置 json字符串
    val operandConfigMapStr: String? = null,
    //@KomapperIgnore val operandMap: Map<OperandConfig>? = null,
    val isSys: Boolean = true,
    val domainId: Int? = null,//自定义记录可以有domainId
    val remark: String? = null, //备注

    @KomapperId @KomapperAutoIncrement
    val id: Int? = null,

    @KomapperIgnore var domain: Domain? = null //domainId 前端列表中需要使用该信息
){
    companion object{
        const val Basic = "Basic"
        const val Collection = "Collection"
        const val Logical = "Logical"
        const val Ext = "Ext"
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
    var typeId: Int ?= null,
    var value: String? = null, //back field json of JsonValue
    val isEnum: Boolean = false, //是否是枚举
    val remark: String? = null,//备注
    val domainId: Int? = null, //domain.id

    @KomapperId @KomapperAutoIncrement
    var id: Int? = null,

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
    val extra: String? = null,//内部附加信息 来自ParamCategory
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
    val extra: String? = null,
    val domainId: Int? = null, //domain.id
    @KomapperId @KomapperAutoIncrement
    val id: Int? = null,

    @KomapperIgnore var domain: Domain? = null,
    @KomapperIgnore var children: List<Param>? = null
){
    fun toBean(service: BaseCrudService){
        domain = domainId?.let{service.findOne(Meta.domain, {Meta.domain.id eq it}, "domain/${it}")}
    }
    fun setupChildren(service: BaseCrudService, sort: SortExpression = Meta.param.id.desc()){
        children = service.findAll(Meta.param,  {
            Meta.param.categoryId eq id
            Meta.param.domainId eq domainId
        }, sort).onEach { it.toBean(service) }
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
    val posPath: List<String>, //此字段用于前端向上遍历找到父节点数据，根节点id在最前面，当前叶子节点id在最后
    val rule: Rule?,//RuleCommon自身是rule，也就是数据来源Rule
    val ruleGroup: RuleGroup?,//RuleCommon自身是RuleGroup，数据来源RuleGroup

    val id: Int?, // 不再使用这种方式：md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
    val typedId: String,//添加前缀rule和group用于区分类型，parentPath查找时区分类型，因添加的subrule or subruleGroup的id可能相同，且在同一个children中
    val level: Int?,
    val label: String?,
    val priority: Int? ,
    val remark: String?,
    val enable: Int ,
    val tags: String?,
    val exclusive: Int,
    val domainId: Int?,
    val description: String? = null,
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
    val remark: String? = null,//相关信息备注
    val description: String? = null, //对命中的说明
    val exprRemark: String? = null,//对表达式的备注说明
    val enable: Int = 1, //与sqlite一致，因为sqlite中么有boolean
    val tags: String? = null,
    val threshhold: Int? = null, //percent

    val exprId: Int? = null,//if exprId not null, use it 如果exprId非空，则exprStr和metaStr来自Expression记录；否则由前端编辑时提供
    val exprStr: String,//json string of LogicalExpr
    val metaStr: String? = null,//json string of ExpressionMeta

    val thenAction: String? = null,// if do
    val elseAction: String? = null, //else do

    val domainId: Int? = null,
    @KomapperIgnore var domain: Domain? = null, //前端列表数据需要

    //@Contextual var expr : LogicalExpr? = null,//由exprStr解析或前端提供
    //@Contextual var meta: ExpressionMeta? = null//由metaStr解析或前端提供

    val exclusive: Int = 0, //chidlren是否互斥

    val ruleChildrenIds: String? = null, // json string of Rule.id List, insert/save one when create a child in front end
    val ruleGroupChildrenIds: String? = null,// json string of RuleGroup.id List, insert one when create a child in front end

    var ruleParentIds: String? = null,
    var ruleGroupParentIds: String? = null,

    //@KomapperIgnore var ruleChildren: List<Rule>? = null,
    //@KomapperIgnore var ruleGroupChildren: List<RuleGroup>? = null,
    //@KomapperIgnore var children: MutableList<RuleCommon> ? = null //为前端构造tree型列表展示，不再使用List<Rule>和List<RuleGroup>，让前端子列表统一
){
    fun toRuleCommon(service: BaseCrudService, childrenMode: TableChildrenMode, path: MutableList<String>? = null): RuleCommon  {
        domain = domainId?.let{ service.findOne(Meta.domain, {Meta.domain.id eq it}) }

        val typedId = "${RuleType.rule.name}-$id"
        return when(childrenMode){
            TableChildrenMode.Tree -> {
                val pair = service.getChildrenTree(RuleType.rule, id!!, ruleChildrenIds, ruleGroupChildrenIds, path) //在新增和修改时无需构建children，因一是没有无需构建，二是修改时构建也是从当前节点开始的，不是从根节点开始的parentPath
                RuleCommon(pair.first,this, null, id, typedId, level, label, priority,
                    remark, enable, tags, exclusive, domainId, null, domain,
                    pair.second)
            }
            TableChildrenMode.LazyLoad ->{
                RuleCommon(listOf("${RuleType.rule.name}-$id"),
                    this, null, id, typedId, level, label, priority,
                    remark, enable, tags, exclusive, domainId, null, domain,
                    service.getChildrenList( ruleChildrenIds, ruleGroupChildrenIds, false))
            }

            TableChildrenMode.None -> {
                RuleCommon(listOf("${RuleType.rule.name}-$id"),
                    this, null, id, typedId, level, label, priority,
                    remark, enable, tags, exclusive, domainId, null, domain,
                    null)
            }
        }
    }



    fun getExpr() = MySerializeJson.decodeFromString<ILogicalExpr>(exprStr)
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
    val exclusive: Int = 1,

    val enable: Int = 1,
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
    fun toRuleCommon(service: BaseCrudService, childrenMode: TableChildrenMode, path: MutableList<String>? = null): RuleCommon  {
        domain = domainId?.let{ service.findOne(Meta.domain, {Meta.domain.id eq it}) }

        val typedId = "${RuleType.ruleGroup.name}-$id"
        return when(childrenMode){
            TableChildrenMode.Tree -> {
                val pair = service.getChildrenTree(RuleType.ruleGroup, id!!, ruleChildrenIds, ruleGroupChildrenIds, path) //在新增和修改时无需构建children，因一是没有无需构建，二是修改时构建也是从当前节点开始的，不是从根节点开始的parentPath
                RuleCommon(pair.first,
                    null, this, id, typedId, level, label, priority,
                    remark, enable, tags, exclusive, domainId, null, domain,
                    pair.second)
            }
            TableChildrenMode.LazyLoad ->{
                RuleCommon(listOf("${RuleType.ruleGroup.name}-$id"),
                    null, this, id, typedId, level, label, priority,
                    remark, enable, tags, exclusive, domainId, null, domain,
                    service.getChildrenList(ruleChildrenIds, ruleGroupChildrenIds, false))
            }

            TableChildrenMode.None -> {
                RuleCommon(listOf("${RuleType.ruleGroup.name}-$id"),
                    null, this, id, typedId, level, label, priority,
                    remark, enable, tags, exclusive, domainId, null, domain,
                    null)
            }
        }
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

/**
 * 对于table tree，可以在后端直接构建树形数据，可以懒加载（前端点击展开按钮时加载children），也可以设置为无子节点
 * */
enum class TableChildrenMode{ Tree, LazyLoad, None}
@Serializable
enum class RuleType{ rule, ruleGroup} //名称将用于RuleCommon中的typedId，http endpoint等
@Serializable
class RuleIdType(val id: Int, val type: RuleType)
@Serializable
class MoveParam(
    val current: RuleIdType, //当前节点
    val newLevel: Int, //移动后的节点level
    val oldParent: RuleIdType? = null, //空表示current为顶级节点
    val newParent: RuleIdType? = null //空表示移动到新顶级节点
)

@Serializable
class RuleAndGroupdIds(val ruleIds: String?, val groupIds: String?)
@Serializable
class MoveResult(
    val e: RuleAndGroupdIds, //当前节点变更后的两种parentIds
    val oldParent: RuleAndGroupdIds?,//old parent变更后的两种childrenIds
    val newParent: RuleAndGroupdIds?//new parent变更后的两种childrenIds
)

@Serializable
class DelResult(
    val count: Long, //总共删除的数量
    val e:  RuleAndGroupdIds?,
    val parent: RuleAndGroupdIds?,//parent变更后的两种childrenIds
)

@Serializable
class InsertNodeResult(
    val ruleCommon: RuleCommon, //插入的节点
    val parent: RuleAndGroupdIds,//parent变更后的两种childrenIds
)