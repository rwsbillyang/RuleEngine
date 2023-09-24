/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-07-14 23:38
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

import com.github.rwsbillyang.ktorKit.ApiJson
import com.github.rwsbillyang.ktorKit.apiBox.BatchOperationParams
import com.github.rwsbillyang.ktorKit.apiBox.DataBox
import com.github.rwsbillyang.ktorKit.apiBox.IUmiPaginationParams
import com.github.rwsbillyang.ktorKit.db.andWhere

import com.github.rwsbillyang.ruleEngine.core.expression.*

import io.ktor.server.application.*
import io.ktor.server.request.*
import kotlinx.serialization.encodeToString
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.komapper.core.dsl.Meta
import org.komapper.core.dsl.expression.WhereDeclaration
import org.slf4j.LoggerFactory


class BaseCrudController : KoinComponent {
    private val log = LoggerFactory.getLogger("BaseCrudController")

    companion object {
        const val Name_domain = "domain"
        const val Name_param = "param"
        const val Name_paramCategory = "paramCategory"
        const val Name_paramType = "paramType"
        const val Name_constant = "constant"
        const val Name_operator = "operator"
        const val Name_expression = "expression"
        const val Name_rule = "rule"
        const val Name_ruleGroup = "ruleGroup"
        const val Name_action = "action"
    }

    private val service: BaseCrudService by inject()


    fun findPage(name: String, params: IUmiPaginationParams): String {
        return when (name) {
            Name_domain -> MySerializeJson.encodeToString(DataBox.ok(service.findAll(Meta.domain, {})))
            Name_param -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.param, params.toSqlPagination()).onEach { it.toBean(service) }))
            Name_paramCategory -> {
                val setupChildren = (params as ParamCategoryQueryParams).setupChildren
                val list = service.findPage(
                    Meta.paramCategory,
                    params.toSqlPagination()
                )

                val list2 = if(setupChildren){
                    val w1: WhereDeclaration = { Meta.param.categoryId.isNull() }
                    val w2: WhereDeclaration? = if(params.domainId != null) {
                        { Meta.param.domainId eq params.domainId }
                    } else null
                    val w3: WhereDeclaration? = if(params.typeId != null) {
                        { Meta.param.typeId eq params.typeId } } else null
                    val uncategoryParams = service.findAll(Meta.param, andWhere(w1,w2,w3)).onEach { it.toBean(service) }
                    if(uncategoryParams.isNotEmpty()){
                        val unCategory = ParamCategory("未分类", params.domainId, -1, null, uncategoryParams)
                        if(list.isEmpty()){
                            listOf(unCategory)
                        }else{
                            list.onEach { it.setupChildren(service) }
                                .toMutableList()
                                .apply{ add(unCategory) }
                        }
                    }else{
                        list.onEach { it.setupChildren(service) }
                    }

                    //只保留有typeId的
                    if(params.typeId != null){
                        list.filter{ it.children != null && it.children!!.any { it.typeId == params.typeId}}.filter{it.children!!.isNotEmpty() }
                    }else list.filter{ !it.children.isNullOrEmpty() }
                }else{
                    list.onEach { it.toBean(service) }
                }
                return MySerializeJson.encodeToString(DataBox.ok(list2))
            }
            Name_paramType -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.paramType, params.toSqlPagination()).onEach { it.toBean(service) }))
            Name_constant -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.constant, params.toSqlPagination()).onEach { it.toBean(service) }))
            Name_operator -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.operator,params.toSqlPagination())))
            Name_expression -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.expression, params.toSqlPagination()).onEach { it.toBean(service) }))
            Name_rule -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.rule, params.toSqlPagination()).map { it.toRuleCommon(service) }))
            Name_ruleGroup -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.ruleGroup, params.toSqlPagination()).map { it.toRuleCommon(service) }))
            Name_action -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.ruleAction, params.toSqlPagination())))
            else -> {
                log.warn("findPage: Not support $name in findPageList")
                MySerializeJson.encodeToString(DataBox.ko<Unit>("findPage: Not support $name in findPageList"))
            }
        }
    }

    /**
     * @return 返回DataBox的json字符串
     * */
    fun findOne(name: String, id: Int): String {
        return when (name) {
            Name_domain -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.domain, { Meta.domain.id eq id }, "domain/$id")))
            Name_param -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.param, { Meta.param.id eq id }, "param/$id")?.apply { toBean(service) }))
            Name_paramCategory -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.paramCategory, { Meta.paramCategory.id eq id }, "paramCategory/$id")?.apply { toBean(service) }))
            Name_paramType -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.paramType, { Meta.paramType.id eq id }, "paramType/$id")?.apply { toBean(service) }))
            Name_constant -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.constant, { Meta.constant.id eq id }, "constant/$id")?.apply { toBean(service) }))
            Name_operator -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.operator, { Meta.operator.id eq id }, "operator/$id")))
            Name_expression -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.expression, { Meta.expression.id eq id }, "expression/$id")?.apply { toBean(service) }))
            Name_rule -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.rule, { Meta.rule.id eq id }, "rule/$id")?.toRuleCommon(service)))
            Name_ruleGroup -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")?.toRuleCommon(service)))
            Name_action -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.ruleAction, { Meta.ruleAction.id eq id }, "ruleAction/$id")))
            else -> {
                log.warn("findOne: Not support $name in findOne")
                MySerializeJson.encodeToString(DataBox.ko<Unit>("findOne: Not support $name in findOne"))
            }
        }
    }

    /**
     * @return 返回DataBox的json字符串
     * 新增顶级节点、编辑修改时的保存，
     * 在新增和鞭酒修改时无需构建children，因1是新增时没有无需构建，2是修改时构建也是从当前节点开始的，不是从根节点开始的parentPath
     * */
    suspend fun saveOne(name: String, call: ApplicationCall) = when (name) {
        Name_domain -> {
            val e = call.receive<Domain>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.domain, e, e.id == null, e.id?.let { "domain/${it}" })))
        }

        Name_param -> {
            val e = call.receive<Param>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.param, e, e.id == null, e.id?.let { "param/${it}" }).apply { toBean(service) }))
        }
        Name_paramCategory -> {
            val e = call.receive<ParamCategory>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.paramCategory, e, e.id == null, e.id?.let { "paramCategory/${it}" }).apply { toBean(service) }))
        }
        Name_paramType -> {
            val e = call.receive<ParamType>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.paramType, e, e.id == null, e.id?.let { "paramType/${it}" }).apply { toBean(service) }))
        }
        Name_constant -> {
            val e = call.receive<Constant>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.constant, e, e.id == null, e.id?.let { "constant/${it}" }).apply { toBean(service) }))
        }
        Name_operator -> {
            val e = call.receive<Operator>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.operator, e, e.id == null, e.id?.let { "operator/${it}" })))
        }
        Name_expression -> {
            val e = call.receive<Expression>()//.apply { toEntity() }
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.expression, e, e.id == null, e.id?.let { "expression/${it}" }).apply { toBean(service) }))
        }
        Name_rule -> {
            val e = call.receive<Rule>()
            // 查询再插入，非原子性，并发时容易出问题
            //val old = service.findOne(Meta.rule, { Meta.rule.id eq e.id }, "rule/${e.id}")
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.rule, e, e.id == null, "rule/${e.id}").toRuleCommon(null)))//1是新增时没有无需构建，2是修改时构建也是从当前节点开始的，不是从根节点开始的parentPath
        }
        Name_ruleGroup -> {
            val e = call.receive<RuleGroup>()
            //查询再插入，非原子性，并发时容易出问题
            //val old = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq e.id }, "ruleGroup/${e.id}")
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.ruleGroup, e, e.id == null, "ruleGroup/${e.id}").toRuleCommon(null)))//1是新增时没有无需构建，2是修改时构建也是从当前节点开始的，不是从根节点开始的parentPath
        }
        Name_action -> {
            val e = call.receive<RuleAction>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.ruleAction, e, e.id == null, e.id?.let { "ruleAction/${it}" })))
        }
        else -> MySerializeJson.encodeToString(DataBox.ko<Int>("saveOne: not support $name"))
    }

    /**
     * 删除一项
     * */
    fun delOne(name: String, id: Int): DataBox<Long> {
        val count = when (name) {
            Name_domain -> service.delete(Meta.domain, { Meta.domain.id eq id }, "domain/$id")
            Name_param -> service.delete(Meta.param, { Meta.param.id eq id }, "param/$id")
            Name_paramCategory -> service.delete(Meta.paramCategory, { Meta.paramCategory.id eq id }, "paramCategory/$id")
            Name_paramType -> service.delete(Meta.paramType, { Meta.paramType.id eq id }, "paramType/$id")
            Name_constant -> service.delete(Meta.constant, { Meta.constant.id eq id }, "constant/$id")
            Name_operator -> service.delete(Meta.operator, { Meta.operator.id eq id }, "operator/$id")
            Name_expression -> service.delete(Meta.expression, { Meta.expression.id eq id }, "expression/$id")
            Name_rule -> service.delete(Meta.rule, { Meta.rule.id eq id }, "rule/$id")
            //Name_ruleGroup -> service.delete(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")
            //Name_action -> service.delete(Meta.ruleAction, { Meta.ruleAction.id eq id }, "ruleAction/$id")
            else -> {
                log.warn("delOne: Not support $name in delOne")
                0L
            }
        }
        return DataBox.ok(count)
    }

    /**
     * 批处理，暂只支持action：fakeDel
     * */
    fun batchOperation(name: String, batchParams: BatchOperationParams): DataBox<Long> {
        val ids = batchParams.ids.split(",").map { it.toInt() }

        if (ids.isEmpty())
            return DataBox.ko("batchOperation: invalid parameter: no name or ids")

        return when (batchParams.action) {
            "del" -> DataBox.ok(batchDel(name, ids))
            else -> DataBox.ko("batchOperation: not support action: ${batchParams.action}")
        }
    }

    private fun batchDel(name: String, ids: List<Int>): Long {
        val count = when (name) {
            Name_domain -> service.delete(Meta.domain, { Meta.domain.id inList ids.map { it } }, null, ids.map { "domain/$it" })
            Name_param -> service.delete(Meta.param, { Meta.param.id inList ids.map { it } }, null, ids.map { "param/$it" })
            Name_paramCategory -> service.delete(Meta.paramCategory, { Meta.paramCategory.id inList ids.map { it } }, null, ids.map { "paramCategory/$it" })
            Name_paramType -> service.delete(Meta.paramType, { Meta.paramType.id inList ids.map { it } }, null, ids.map { "paramType/$it" })
            Name_constant -> service.delete(Meta.constant, { Meta.constant.id inList ids.map { it } }, null, ids.map { "constant/$it" })
            Name_operator -> service.delete(Meta.operator, { Meta.operator.id inList ids.map { it } }, null, ids.map { "operator/$it" })
            Name_expression -> service.delete(Meta.expression, { Meta.expression.id inList ids.map { it } }, null, ids.map { "expression/$it" })
            Name_rule -> service.delete(Meta.rule, { Meta.rule.id inList ids }, null, ids.map { "rule/$it" })
            //Name_ruleGroup -> service.delete(Meta.ruleGroup, { Meta.ruleGroup.id inList ids }, null, ids.map{"ruleGroup/$it"})
            //Name_action -> service.delete(Meta.ruleAction, { Meta.ruleAction.id inList ids.map{it} }, null, ids.map{"ruleAction/$it"})
            else -> {
                log.warn("batchOperation: Not support $name in batchDel")
                0L
            }
        }
        return count
    }

    fun initDictDataInDb(): String {
        val map = mutableMapOf<String, Operator>()
        //将系统内置支持的操作符写入数据库，并构建map
        EnumOp.values()
            .map { Operator(it.label, it.name, it.remark, OpType.Basic) }
            .let { service.batchSave(Meta.operator, it, true) }
            .forEach { map[it.code] = it }

        EnumCollectionOp.values()
            .map { Operator(it.label, it.name, it.remark, OpType.Collection) }
            .let { service.batchSave(Meta.operator, it, true) }
            .forEach { map[it.code] = it }

        EnumLogicalOp.values()
            .map { Operator(it.label, it.name, it.remark, OpType.Logical) }
            .let { service.batchSave(Meta.operator, it, true) }
            .forEach { map[it.code] = it }

        //构建内置数据类型并插入库
        val list = listOf(
            ParamType(StringType.label,StringType.code,StringType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","),true),
            ParamType(IntType.label,IntType.code,IntType.supportOperators().mapNotNull { map[it]?.id}.joinToString(","),true),
            ParamType(LongType.label,LongType.code,LongType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), true),
            ParamType(DoubleType.label,DoubleType.code,DoubleType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), true),
            ParamType(DateTimeType.label, DateTimeType.code, DateTimeType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), true),
            ParamType(BoolType.label, BoolType.code, BoolType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), true),
            ParamType(StringSetType.label, StringSetType.code, StringSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), false),
            ParamType(IntSetType.label, IntSetType.code, IntSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), false),
            ParamType(LongSetType.label, LongSetType.code, LongSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), false),
            ParamType(DoubleSetType.label, DoubleSetType.code, DoubleSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), false),
            ParamType(DateTimeSetType.label, DateTimeSetType.code, DateTimeSetType.supportOperators().mapNotNull { map[it]?.id }.joinToString(","), false),
        )
        val types = service.batchSave(Meta.paramType, list, true)

        val opsJson = ApiJson.serverSerializeJson.encodeToString(map)
        val typesJson = ApiJson.serverSerializeJson.encodeToString(types)
        return "opsJson=$opsJson, typesJson=$typesJson"
    }




    /**
     * 在rule中插入子rule，亲子关系数据后端维护，前端不做任何变动
     * 插入成功后，返回给前端的数据，前端负责插入到children中，做树形显示
     * @param rule 待插入或更新的子rule 若已存在，则修改子rule新的字段值以及亲子关系
     * @param parentRuleId 父rule的id
     * */
    public fun saveRuleInParentRule(rule: Rule, parentRuleId: Int): RuleCommon {
        val old = rule.id?.let { service.findOne(Meta.rule, { Meta.rule.id eq it }, "rule/${rule.id}") }
        //更新亲子关系数据，其它3个前端不做变动，仍旧传递回来
        rule.ruleParentIds = addId(old?.ruleParentIds, parentRuleId)
        val newOne = service.save(Meta.rule, rule, old == null, "rule/${rule.id}")

        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentRuleId }, "rule/$parentRuleId")
        if (parent == null) {
            log.warn("no parentRule, parentRuleId=$parentRuleId when del")
        } else {
            //更新父Rule的子rule节点：在父rule的ruleChildrenIds中添加id并更新父rule
            val ruleChildrenIds = addId(parent.ruleChildrenIds, newOne.id)
            if (ruleChildrenIds != parent.ruleChildrenIds) {
                service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.rule.id eq parentRuleId },
                    "rule/$parentRuleId"
                )
            }
        }

        //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
        return newOne.toRuleCommon(service)//转换成RuleCommon用于给前端添加到children中，展示到树形列表中
    }

    /**
     * 在rule中插入子rule，亲子关系数据后端维护，前端不做任何变动
     * 插入成功后，返回给前端的数据，前端负责插入到children中，做树形显示
     * @param ruleGroup 待插入或更新的子ruleGroup 若已存在，则修改子ruleGroup新的字段值以及亲子关系
     * @param parentRuleId 父rule的id
     * */
    public fun saveRuleGroupInParentRule(ruleGroup: RuleGroup, parentRuleId: Int): RuleCommon {
        val old = if(ruleGroup.id != null)
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq ruleGroup.id }, "ruleGroup/${ruleGroup.id}")
        else null

        ruleGroup.ruleParentIds = addId(old?.ruleChildrenIds, parentRuleId)
        val newOne = service.save(Meta.ruleGroup, ruleGroup, old == null, "ruleGroup/${ruleGroup.id}")

        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentRuleId }, "rule/$parentRuleId")
        if (parent == null) {
            log.warn("no parentRule, parentRuleId=$parentRuleId when del")
        } else {
            //更新父Rule的子ruleGroup节点：在父rule的ruleGroupChildrenIds中添加id并更新父rule
            val ruleGroupChildrenIds = addId(parent.ruleGroupChildrenIds, newOne.id)
            if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.rule.id eq parentRuleId },
                    "rule/$parentRuleId"
                )
            }
        }

        //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
        return newOne.toRuleCommon(service)//转换成RuleCommon用于给前端添加到children中，展示到树形列表中
    }

    /**
     * 在rule中插入子ruleGroup，亲子关系数据后端维护，前端不做任何变动
     * 插入成功后，返回给前端的数据，前端负责插入到children中，做树形显示
     * @param ruleGroup 待插入或更新的子ruleGroup 若已存在，则修改子ruleGroup新的字段值以及亲子关系
     * @param parentRuleGroupId 父ruleGroup的id
     * */
    public fun saveRuleGroupInParentRuleGroup(ruleGroup: RuleGroup, parentRuleGroupId: Int): RuleCommon {
        val old = if(ruleGroup.id != null)
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq ruleGroup.id }, "ruleGroup/${ruleGroup.id}")
        else null

        ruleGroup.ruleGroupParentIds = addId(old?.ruleGroupParentIds, parentRuleGroupId)
        val newOne = service.save(Meta.ruleGroup, ruleGroup, old == null, "ruleGroup/${ruleGroup.id}")

        val parent =
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq parentRuleGroupId }, "ruleGroup/$parentRuleGroupId")
        if (parent == null) {
            log.warn("no parentRuleGroup, parentRuleGroupId=$parentRuleGroupId when del")
        } else {
            //更新父RuleGroup的子ruleGroup节点：在父rule的ruleGroupChildrenIds中添加id并更新父rule
            val ruleGroupChildrenIds = addId(parent.ruleGroupChildrenIds, newOne.id)
            if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.ruleGroup.id eq parentRuleGroupId },
                    "ruleGroup/$parentRuleGroupId"
                )
            }
        }
        //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
        return newOne.toRuleCommon(service)//转换成RuleCommon用于给前端添加到children中，展示到树形列表中
    }

    /**
     * 在rule中插入子rule，亲子关系数据后端维护，前端不做任何变动
     * 插入成功后，返回给前端的数据，前端负责插入到children中，做树形显示
     * @param rule 待插入或更新的子rule 若已存在，则修改子rule新的字段值以及亲子关系
     * @param parentRuleGroupId 父ruleGroup的id
     * */
    public fun saveRuleInParentRuleGroup(rule: Rule, parentRuleGroupId: Int): RuleCommon {
        val old = if(rule.id != null)
            service.findOne(Meta.rule, { Meta.rule.id eq rule.id }, "rule/${rule.id}")
        else null

        rule.ruleGroupParentIds = addId(old?.ruleGroupParentIds, parentRuleGroupId)
        val newOne = service.save(Meta.rule, rule, old == null, "rule/${rule.id}")

        val parent =
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq parentRuleGroupId }, "ruleGroup/$parentRuleGroupId")
        if (parent == null) {
            log.warn("no parentRuleGroup, parentRuleGroupId=$parentRuleGroupId when del")
        } else {
            //更新父RuleGroup的子rule节点：在父ruleGroup的ruleChildrenIds中添加id并更新父ruleGroup
            val ruleChildrenIds = addId(parent.ruleChildrenIds, newOne.id)
            if (ruleChildrenIds != parent.ruleChildrenIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.ruleGroup.id eq parentRuleGroupId },
                    "ruleGroup/$parentRuleGroupId"
                )
            }
        }
        //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
        return newOne.toRuleCommon(service) //转换成RuleCommon用于给前端添加到children中，展示到树形列表中
    }

    /**
     * 从以,分隔的字符串中添加id，并返回添加后新的字符串
     * */
    private fun addId(ids: String?, id: Int?): String? {
        if (id == null) return ids
        if (ids.isNullOrEmpty()) return id.toString()

        val set = ids.split(",").toList().toMutableSet()
        set.add(id.toString())
        return set.joinToString(",")
    }

    /**
     * 从以,分隔的字符串中移出id，并返回移出后新的字符串
     * */
    private fun removeId(ids: String?, id: Int): String? {
        if (ids.isNullOrEmpty()) return null
        val set = ids.split(",").toList().toMutableSet()
        set.remove(id.toString())
        if (set.isEmpty()) return null
        else return set.joinToString(",")
    }

    /**
     * 删除父rule下的子rule
     *
     * 若是多亲（有父group，或其它父rule），则只拆除亲子关系
     * 若只是单亲，且单亲是parentId：若有孩子，则递归调用删除孩子，若无孩子则删除自己
     *
     * @param id 子rule的id
     * @param parentRuleId 父rule的id 若为空则可能是root级别
     * */
    public fun removeRuleInParentRule(id: Int, parentRuleId: Int?): Long {
        var count = 0L
        val rule = service.findOne(Meta.rule, { Meta.rule.id eq id }, "rule/$id")
        if (rule == null) {
            log.warn("no child rule, id=$id when del, parentRuleId=$parentRuleId")
            return count
        }

        val ruleParent = rule.ruleParentIds?.split(",")
        val groupParent = rule.ruleGroupParentIds?.split(",")

        //只是单亲, 先删除rule
        if (groupParent.isNullOrEmpty() //没有父group，
            //且： 没有其它父rule（或只有一个且是parentId）
            && (ruleParent.isNullOrEmpty() || (ruleParent.size == 1 && ruleParent[0] == parentRuleId.toString()))
        ) {
            val groupChildren = rule.ruleGroupChildrenIds?.split(",")
            val ruleChildren = rule.ruleChildrenIds?.split(",")

            //若有孩子，先递归删除rule的孩子，再删除rule
            groupChildren?.forEach {
                count += removeRuleGroupInParentRule(it.toInt(), id) //删除rule下的group孩子：可能删除了孩子，也可能只是拆解父子关系
            }
            ruleChildren?.forEach {
                count += removeRuleInParentRule(it.toInt(), id)//删除rule下的rule孩子：可能删除了孩子，也可能只是拆解父子关系
            }

            //若无孩子，上面的不被执行，将直接将其删除
            count += service.delete(Meta.rule, { Meta.rule.id eq id }, "rule/$id")

        } else if (parentRuleId != null) {//非单亲：有父group，or有其它父rule，只拆除亲子关系 注意：拆除非原子操作
            //更新子rule的父rule节点: 从rule的ruleParentIds中移出parentRuleId并更新rule
            val ruleParentIds = removeId(rule.ruleParentIds, parentRuleId)
            if (ruleParentIds != rule.ruleParentIds) {
                service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleParentIds eq ruleParentIds },
                    { Meta.rule.id eq id },
                    "rule/$id"
                )
            }
        }
        if (parentRuleId != null) {
            val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentRuleId }, "rule/$parentRuleId")
            if (parent == null) {
                log.warn("no parentRule, parentRuleId=$parentRuleId when del")
            } else {
                //更新父Rule的子rule节点：从父rule的ruleChildrenIds中移出id并更新父rule
                val ruleChildrenIds = removeId(parent.ruleChildrenIds, id)
                if (ruleChildrenIds != parent.ruleChildrenIds) {
                    service.updateValues(
                        Meta.rule,
                        { Meta.rule.ruleChildrenIds eq ruleChildrenIds },
                        { Meta.rule.id eq parentRuleId },
                        "rule/$parentRuleId"
                    )
                }
            }
        }


        return count
    }

    /**
     * 删除父rule下的子ruleGroup
     *
     * 若是多亲（有父group，或其它父rule），则只拆除亲子关系
     * 若只是单亲，且单亲是parentId：若有孩子，则递归调用删除孩子，若无孩子则删除自己
     *
     * @param id 子ruleGroup的id
     * @param parentRuleId 父rule的id 若为空则可能是root级别
     * */
    public fun removeRuleGroupInParentRule(id: Int, parentRuleId: Int?): Long {
        var count = 0L
        val ruleGroup = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")
        if (ruleGroup == null) {
            log.warn("no child ruleGroup, id=$id when del, parentRuleId=$parentRuleId")
            return count
        }

        val ruleParent = ruleGroup.ruleParentIds?.split(",")
        val groupParent = ruleGroup.ruleGroupParentIds?.split(",")

        //只是单亲, 先删除ruleGroup
        if (groupParent.isNullOrEmpty() //没有父group，
            //且： 没有其它父rule（或只有一个且是parentId）
            && (ruleParent.isNullOrEmpty() || (ruleParent.size == 1 && ruleParent[0] == parentRuleId.toString()))
        ) {
            val groupChildren = ruleGroup.ruleGroupChildrenIds?.split(",")
            val ruleChildren = ruleGroup.ruleChildrenIds?.split(",")

            //若有孩子，先递归删除rule的孩子，再删除rule
            groupChildren?.forEach {
                count += removeRuleGroupInParentRuleGroup(it.toInt(), id) //删除ruleGroup下的group孩子：可能删除了孩子，也可能只是拆解父子关系
            }
            ruleChildren?.forEach {
                count += removeRuleInParentRuleGroup(it.toInt(), id)//删除ruleGroup下的rule孩子：：可能删除了孩子，也可能只是拆解父子关系
            }

            //若无孩子，上面的不被执行，将直接将其删除
            count += service.delete(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")

        } else if (parentRuleId != null) {//非单亲：有父group，or有其它父rule，只拆除亲子关系 注意：拆除非原子操作
            //更新子ruleGroup的父rule节点: 从rule的ruleParentIds中移出parentRuleId并更新ruleGroup
            val ruleParentIds = removeId(ruleGroup.ruleParentIds, parentRuleId)
            if (ruleParentIds != ruleGroup.ruleParentIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleParentIds eq ruleParentIds },
                    { Meta.ruleGroup.id eq id },
                    "ruleGroup/$id"
                )
            }
        }
        if (parentRuleId != null) {
            val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentRuleId }, "rule/$parentRuleId")
            if (parent == null) {
                log.warn("no parentRule, parentRuleId=$parentRuleId when del")
            } else {
                //更新父Rule的子group节点：从父rule的ruleGroupChildrenIds中移出id并更新父rule
                val ruleGroupChildrenIds = removeId(parent.ruleGroupChildrenIds, id)
                if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                    service.updateValues(
                        Meta.rule,
                        { Meta.rule.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                        { Meta.rule.id eq parentRuleId },
                        "rule/$parentRuleId"
                    )
                }
            }
        }


        return count
    }

    /**
     * 删除父ruleGroup下的子ruleGroup
     *
     * 若是多亲（有父group，或其它父rule），则只拆除亲子关系
     * 若只是单亲，且单亲是parentId：若有孩子，则递归调用删除孩子，若无孩子则删除自己
     *
     * @param id 子ruleGroup的id
     * @param parentRuleGroupId 父ruleGroup的id 若为空则可能是root级别
     * */
    public fun removeRuleGroupInParentRuleGroup(id: Int, parentRuleGroupId: Int?): Long {
        var count = 0L
        val ruleGroup = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")
        if (ruleGroup == null) {
            log.warn("no child ruleGroup, id=$id when del, parentRuleGroupId=$parentRuleGroupId")
            return count
        }

        val ruleParent = ruleGroup.ruleParentIds?.split(",")
        val groupParent = ruleGroup.ruleGroupParentIds?.split(",")

        //只是单亲, 先删除ruleGroup
        if (ruleParent.isNullOrEmpty() //没有父rule，
            //且： 没有其它父rule（或只有一个且是parentId）
            && (groupParent.isNullOrEmpty() || (groupParent.size == 1 && groupParent[0] == parentRuleGroupId.toString()))
        ) {
            val groupChildren = ruleGroup.ruleGroupChildrenIds?.split(",")
            val ruleChildren = ruleGroup.ruleChildrenIds?.split(",")

            //若有孩子，先递归删除rule的孩子，再删除rule
            groupChildren?.forEach {
                count += removeRuleGroupInParentRuleGroup(it.toInt(), id) //删除ruleGroup下的group孩子：可能删除了孩子，也可能只是拆解父子关系
            }
            ruleChildren?.forEach {
                count += removeRuleInParentRuleGroup(it.toInt(), id)//删除ruleGroup下的rule孩子：：可能删除了孩子，也可能只是拆解父子关系
            }

            //若无孩子，上面的不被执行，将直接将其删除
            count += service.delete(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")

        } else if (parentRuleGroupId != null) {//非单亲：有父group，or有其它父rule，只拆除亲子关系 注意：拆除非原子操作
            //更新子ruleGroup的父group节点: 从rule的ruleParentIds中移出parentRuleId并更新ruleGroup
            val ruleGroupParentIds = removeId(ruleGroup.ruleGroupParentIds, parentRuleGroupId)
            if (ruleGroupParentIds != ruleGroup.ruleGroupParentIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleGroupParentIds eq ruleGroupParentIds },
                    { Meta.ruleGroup.id eq id },
                    "ruleGroup/$id"
                )
            }
        }
        if (parentRuleGroupId != null) {
            val parent =
                service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq parentRuleGroupId }, "rule/$parentRuleGroupId")
            if (parent == null) {
                log.warn("no parentRuleGroup, parentRuleGroupId=$parentRuleGroupId when del")
            } else {
                //更新父RuleGroup子group节点：从父RuleGroup的ruleGroupChildrenIds中移出id并更新父RuleGroup
                val ruleGroupChildrenIds = removeId(parent.ruleGroupChildrenIds, id)
                if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                    service.updateValues(
                        Meta.ruleGroup,
                        { Meta.ruleGroup.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                        { Meta.ruleGroup.id eq parentRuleGroupId },
                        "ruleGroup/$parentRuleGroupId"
                    )
                }
            }
        }


        return count
    }


    /**
     * 删除父ruleGroup下的子rule
     *
     * 若是多亲（有父group，或其它父rule），则只拆除亲子关系
     * 若只是单亲，且单亲是parentId：若有孩子，则递归调用删除孩子，若无孩子则删除自己
     *
     * @param id 子rule的id
     * @param parentRuleGroupId 父ruleGroup的id 若为空则可能是root级别
     * */
    public fun removeRuleInParentRuleGroup(id: Int, parentRuleGroupId: Int?): Long {
        var count = 0L
        val rule = service.findOne(Meta.rule, { Meta.rule.id eq id }, "rule/$id")
        if (rule == null) {
            log.warn("no child rule, id=$id when del, parentRuleGroupId=$parentRuleGroupId")
            return count
        }

        val ruleParent = rule.ruleParentIds?.split(",")
        val groupParent = rule.ruleGroupParentIds?.split(",")

        //只是单亲, 先删除rule
        if (ruleParent.isNullOrEmpty() //没有父rule，
            //且： 没有其它父ruleGroup（或只有一个且是parentRuleGroupId）
            && (groupParent.isNullOrEmpty() || (groupParent.size == 1 && groupParent[0] == parentRuleGroupId.toString()))
        ) {
            val groupChildren = rule.ruleGroupChildrenIds?.split(",")
            val ruleChildren = rule.ruleChildrenIds?.split(",")

            //若有孩子，先递归删除rule的孩子，再删除rule
            groupChildren?.forEach {
                count += removeRuleGroupInParentRule(it.toInt(), id) //删除rule下的group孩子：可能删除了孩子，也可能只是拆解父子关系
            }
            ruleChildren?.forEach {
                count += removeRuleInParentRule(it.toInt(), id)//删除rule下的rule孩子：：可能删除了孩子，也可能只是拆解父子关系
            }

            //若无孩子，上面的不被执行，将直接将其删除
            count += service.delete(Meta.rule, { Meta.rule.id eq id }, "rule/$id")

        } else if (parentRuleGroupId != null){//非单亲：有父group，or有其它父rule，只拆除亲子关系 注意：拆除非原子操作
                //更新子rule的父group节点: 从rule的ruleGroupParentIds中移出parentRuleId并更新ruleGroup
                val ruleGroupParentIds = removeId(rule.ruleGroupParentIds, parentRuleGroupId)
                if (ruleGroupParentIds != rule.ruleGroupParentIds) {
                    service.updateValues(
                        Meta.rule,
                        { Meta.rule.ruleGroupParentIds eq ruleGroupParentIds },
                        { Meta.rule.id eq id },
                        "rule/$id"
                    )
                }
            }
            if (parentRuleGroupId != null) {
                val parent = service.findOne(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.id eq parentRuleGroupId },
                    "ruleGroup/$parentRuleGroupId"
                )
                if (parent == null) {
                    log.warn("no parentRuleGroup, parentRuleGroupId=$parentRuleGroupId when del")
                } else {
                    //更新父RuleGroup的子rule节点：从父RuleGroup的ruleChildrenIds中移出id并更新父RuleGroup
                    val ruleChildrenIds = removeId(parent.ruleChildrenIds, id)
                    if (ruleChildrenIds != parent.ruleChildrenIds) {
                        service.updateValues(
                            Meta.ruleGroup,
                            { Meta.ruleGroup.ruleChildrenIds eq ruleChildrenIds },
                            { Meta.ruleGroup.id eq parentRuleGroupId },
                            "ruleGroup/$parentRuleGroupId"
                        )
                    }
                }
            }


        return count
    }
}


