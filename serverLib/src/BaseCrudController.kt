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


import com.github.rwsbillyang.ktorKit.ApiJson.apiJsonBuilder
import com.github.rwsbillyang.ktorKit.LocalDateTimeAsStringSerializer
import com.github.rwsbillyang.ktorKit.apiBox.BatchOperationParams
import com.github.rwsbillyang.ktorKit.apiBox.DataBox
import com.github.rwsbillyang.ktorKit.apiBox.IUmiPaginationParams
import com.github.rwsbillyang.ktorKit.db.andWhere
import com.github.rwsbillyang.rule.runtime.ruleRuntimeExprSerializersModule


import io.ktor.server.application.*
import io.ktor.server.request.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.contextual
import kotlinx.serialization.modules.plus
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.komapper.core.dsl.Meta
import org.komapper.core.dsl.QueryDsl
import org.komapper.core.dsl.expression.WhereDeclaration
import org.komapper.core.dsl.operator.desc
import org.komapper.core.dsl.operator.or
import org.komapper.core.dsl.query.get
import org.komapper.core.dsl.query.getNotNull
import org.slf4j.LoggerFactory


class BaseCrudController : KoinComponent {
    private val log = LoggerFactory.getLogger("BaseCrudController")

    companion object {
        const val Name_domain = "domain"
        const val Name_param = "param"
        const val Name_paramCategory = "paramCategory"
        const val Name_paramType = "paramType"
        const val Name_constant = "constant"
        const val Name_opcode = "opcode"
        const val Name_expression = "expression"
        const val Name_rule = "rule"
        const val Name_ruleGroup = "ruleGroup"
        const val Name_action = "action"
    }

    val service: BaseCrudService by inject()


    fun findPage(name: String, params: IUmiPaginationParams): String {
        return when (name) {
            Name_domain -> MySerializeJson.encodeToString(DataBox.ok(service.findAll(Meta.domain, {})))
            Name_param -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.param, params.toSqlPagination()).onEach { it.toBean(service) }))
            Name_paramCategory -> {
                val setupChildren = (params as ParamCategoryQueryParams).setupChildren
                var list = service.findPage(
                    Meta.paramCategory,
                    params.toSqlPagination()
                )

                val list2 = if(setupChildren){
                    val w1: WhereDeclaration = { Meta.param.categoryId.isNull() }
                    val w2: WhereDeclaration? = if(params.domainId != null) {
                        //{ Meta.param.domainId eq params.domainId }
                        val self: WhereDeclaration = { Meta.param.domainId eq params.domainId }
                        val defaultAll: WhereDeclaration =  { Meta.param.domainId.isNull() } //若指定了domainId，也包括那些没指定的domainId的常量
                        self.or(defaultAll)
                    } else null
                    val w3: WhereDeclaration? = if(params.typeId != null) {
                        { Meta.param.typeId eq params.typeId } } else null
                    val uncategoryParams = service.findAll(Meta.param, andWhere(w1,w2,w3), Meta.param.id.desc()).onEach { it.toBean(service) }
                    log.info("uncategoryParams.size=${uncategoryParams.size}")
                    if(uncategoryParams.isNotEmpty()){
                        val unCategory = ParamCategory("未分类", null, params.domainId, -1, null, uncategoryParams)
                        if(list.isEmpty()){
                            listOf(unCategory)
                        }else{
                            list = list.onEach { it.setupChildren(service) }
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
            Name_opcode -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.opcode,params.toSqlPagination()).onEach { it.toBean(service) }))
            Name_expression -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.expression, params.toSqlPagination()).onEach { it.toBean(service) }))
            Name_rule -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.rule, params.toSqlPagination()).map { it.toRuleCommon(service, TableChildrenMode.LazyLoad, null) }))
            Name_ruleGroup -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.ruleGroup, params.toSqlPagination()).map { it.toRuleCommon(service, TableChildrenMode.LazyLoad, null) }))
            Name_action -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.ruleAction, params.toSqlPagination())))
            else -> {
                log.warn("findPage: Not support $name in findPageList")
                MySerializeJson.encodeToString(DataBox.ko<Unit>("findPage: Not support $name in findPageList"))
            }
        }
    }

    fun loadChildren(name: String, id: Int): String
    {
        return when (name) {
            Name_rule -> {
                val rule = service.findOne(Meta.rule, { Meta.rule.id eq id }, "rule/$id")
                if(rule != null){
                    MySerializeJson.encodeToString(DataBox.ok(
                        service.getChildrenList(rule.ruleChildrenIds, rule.ruleGroupChildrenIds, true)
                    ))
                }else{
                    log.warn("Not found rule, id=$id in findChildren")
                    MySerializeJson.encodeToString(DataBox.ko<Unit>("Not found rule, id=$id"))
                }
            }
            Name_ruleGroup -> {
                val ruleGroup = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")
                if(ruleGroup != null){
                    MySerializeJson.encodeToString(DataBox.ok(
                        service.getChildrenList(ruleGroup.ruleChildrenIds, ruleGroup.ruleGroupChildrenIds, true)
                    ))
                }else{
                    log.warn("Not found ruleGroup, id=$id in findChildren")
                    MySerializeJson.encodeToString(DataBox.ko<Unit>("Not found ruleGroup, id=$id"))
                }
            }
            else -> {
                log.warn("Not support $name in findChildren")
                MySerializeJson.encodeToString(DataBox.ko<Unit>("Not support $name in findChildren"))
            }
        }
    }





    //special case workaround 不考虑其他查询条件，只根据id列表查
    fun findInIdList(name: String, ids: String) = when(name){
        Name_constant -> {
            val list = service.findInList(Meta.constant, ids){
                Constant(it.getNotNull("label"), it.get("type_id"), it.get("value"), it.get("is_enum")?:false, it.get("remark"), it.get("domain_id"), it.get("id") )
            }
            MySerializeJson.encodeToString(DataBox.ok(list.onEach { it.toBean(service) }))
        }
        Name_opcode -> {
            val list = service.findInList(Meta.opcode, ids){
                Opcode(it.getNotNull("label"), it.getNotNull("code"), it.getNotNull("type"), it.get("operand_config_map_str"), it.get("is_sys")?:false,it.get("domain_id"), it.get("remark"),it.get("id") )
            }
            MySerializeJson.encodeToString(DataBox.ok(list.onEach { it.toBean(service) }))
        }
        else -> {
            log.warn("not support $name: findInIdList")
            null
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
            Name_opcode -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.opcode, { Meta.opcode.id eq id }, "opcode/$id")?.apply { toBean(service) }))
            Name_expression -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.expression, { Meta.expression.id eq id }, "expression/$id")?.apply { toBean(service) }))
            Name_rule -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.rule, { Meta.rule.id eq id }, "rule/$id")?.toRuleCommon(service, TableChildrenMode.LazyLoad, null)))
            Name_ruleGroup -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")?.toRuleCommon(service, TableChildrenMode.LazyLoad, null)))
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
        Name_opcode -> {
            val e = call.receive<Opcode>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.opcode, e, e.id == null, e.id?.let { "opcode/${it}" }).apply { toBean(service) }))
        }
        Name_expression -> {
            val e = call.receive<Expression>()//.apply { toEntity() }
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.expression, e, e.id == null, e.id?.let { "expression/${it}" }).apply { toBean(service) }))
        }
        Name_rule -> {
            val e = call.receive<Rule>()
            // 查询再插入，非原子性，并发时容易出问题
            //val old = service.findOne(Meta.rule, { Meta.rule.id eq e.id }, "rule/${e.id}")
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.rule, e, e.id == null, "rule/${e.id}").toRuleCommon(service, TableChildrenMode.None, null)))//1是新增时没有无需构建，2是修改时构建也是从当前节点开始的，不是从根节点开始的parentPath
        }
        Name_ruleGroup -> {
            val e = call.receive<RuleGroup>()
            //查询再插入，非原子性，并发时容易出问题
            //val old = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq e.id }, "ruleGroup/${e.id}")
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.ruleGroup, e, e.id == null, "ruleGroup/${e.id}").toRuleCommon(service, TableChildrenMode.None, null)))//1是新增时没有无需构建，2是修改时构建也是从当前节点开始的，不是从根节点开始的parentPath
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
            Name_opcode -> service.delete(Meta.opcode, { Meta.opcode.id eq id }, "opcode/$id")
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
            Name_opcode -> service.delete(Meta.opcode, { Meta.opcode.id inList ids.map { it } }, null, ids.map { "opcode/$it" })
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


}


