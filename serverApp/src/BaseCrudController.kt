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

import com.github.rwsbillyang.ruleEngine.core.expression.*

import io.ktor.server.application.*
import io.ktor.server.request.*
import kotlinx.serialization.encodeToString
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.komapper.core.dsl.Meta
import org.slf4j.LoggerFactory


class BaseCrudController : KoinComponent {
    private val log = LoggerFactory.getLogger("BaseCrudController")
    companion object{
        const val Name_domain = "domain"
        const val Name_param = "param"
        const val Name_paramType = "paramType"
        const val Name_constant = "constant"
        const val Name_operator = "operator"
        const val Name_expression = "expression"
        const val Name_rule = "rule"
        const val Name_ruleGroup = "ruleGroup"
        const val Name_action = "action"
    }

    private val service: BaseCrudService by inject()



    fun findPage(name: String, params: IUmiPaginationParams): String{
        return when (name) {
            Name_domain -> MySerializeJson.encodeToString(DataBox.ok(service.findAll(Meta.domain,{})))
            Name_param -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.param, params.toSqlPagination()).onEach {it.toBean(service)}))
            Name_paramType -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.paramType, params.toSqlPagination()).onEach {it.toBean(service)}))
            Name_constant -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.constant, params.toSqlPagination()).onEach {it.toBean(service)}))
            Name_operator -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.operator, params.toSqlPagination())))
            Name_expression -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.expression, params.toSqlPagination()).onEach {it.toBean(service)}))
            Name_rule -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.rule, params.toSqlPagination()).onEach {it.toBean(service)}))
            Name_ruleGroup -> MySerializeJson.encodeToString(DataBox.ok(service.findPage(Meta.ruleGroup, params.toSqlPagination()).onEach {it.toBean(service)}))
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
    fun findOne(name: String, id: String): String {
        return when (name) {
            Name_domain -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.domain,{ Meta.domain.id eq id.toInt() }, "domain/$id")))
            Name_param -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.param,{ Meta.param.id eq id.toInt() }, "param/$id")?.apply{toBean(service)}))
            Name_paramType -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.paramType, { Meta.paramType.id eq id.toInt() }, "paramType/$id")?.apply{toBean(service)}))
            Name_constant -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.constant, { Meta.constant.id eq id.toInt() }, "constant/$id")?.apply{toBean(service)}))
            Name_operator -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.operator, { Meta.operator.id eq id.toInt() }, "op/$id")))
            Name_expression -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.expression, { Meta.expression.id eq id.toInt() }, "expression/$id")?.apply{toBean(service)}))
            Name_rule -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.rule, { Meta.rule.id eq id }, "rule/$id")?.apply{toBean(service)}))
            Name_ruleGroup -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")?.apply{toBean(service)}))
            Name_action -> MySerializeJson.encodeToString(DataBox.ok(service.findOne(Meta.ruleAction, { Meta.ruleAction.id eq id.toInt() }, "ruleAction/$id")))
            else -> {
                log.warn("findOne: Not support $name in findOne")
                MySerializeJson.encodeToString(DataBox.ko<Unit>("findOne: Not support $name in findOne"))
            }
        }
    }

    /**
     * @return 返回DataBox的json字符串
     * */
    suspend fun saveOne(name: String, call: ApplicationCall) = when (name) {
        Name_domain -> {
            val e = call.receive<Domain>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.domain,e,e.id == null, e.id?.let{"domain/${it}"})))
        }
        Name_param -> {
            val e = call.receive<Param>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.param,e,e.id == null, e.id?.let{"param/${it}"}).apply{toBean(service)}))
        }
        Name_paramType -> {
            val e = call.receive<ParamType>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.paramType, e, e.id == null, e.id?.let{"paramType/${it}"}).apply{toBean(service)}))
        }
        Name_constant -> {
            val e = call.receive<Constant>()//.apply { toEntity() }
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.constant, e, e.id == null, e.id?.let{"constant/${it}"}).apply{toBean(service)}))
        }
        Name_operator -> {
            val e = call.receive<Operator>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.operator,e,e.id == null, e.id?.let{"op/${it}"})))
        }
        Name_expression -> {
            val e = call.receive<Expression>()//.apply { toEntity() }
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.expression,e,e.id == null, e.id?.let{"expression/${it}"}).apply{toBean(service)}))
        }
        Name_rule -> {
            val e = call.receive<Rule>()
            //TODO: 查询再插入，非原子性，并发时容易出问题
            val old = service.findOne(Meta.rule, { Meta.rule.id eq e.id }, "rule/${e.id}")
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.rule,e,old == null, "rule/${e.id}").apply{toBean(service)}))
        }
        Name_ruleGroup -> {
            val e = call.receive<RuleGroup>()
            //TODO: 查询再插入，非原子性，并发时容易出问题
            val old = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq e.id }, "ruleGroup/${e.id}")
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.ruleGroup,e,old == null,"ruleGroup/${e.id}").apply{toBean(service)}))
        }
        Name_action -> {
            val e = call.receive<RuleAction>()
            MySerializeJson.encodeToString(DataBox.ok(service.save(Meta.ruleAction,e,e.id == null, e.id?.let{"ruleAction/${it}"})))
        }
        else -> MySerializeJson.encodeToString(DataBox.ko<Int>("saveOne: not support $name"))
    }

    /**
     * 删除一项
     * */
    fun delOne(name: String, id: String): DataBox<Long> {
        val count = when (name) {
            Name_domain -> service.delete(Meta.domain, { Meta.domain.id eq id.toInt() })
            Name_param -> service.delete(Meta.param, { Meta.param.id eq id.toInt() })
            Name_paramType -> service.delete(Meta.paramType, { Meta.paramType.id eq id.toInt() })
            Name_constant -> service.delete(Meta.constant, { Meta.constant.id eq id.toInt() })
            Name_operator -> service.delete(Meta.operator, { Meta.operator.id eq id.toInt() })
            Name_expression -> service.delete(Meta.expression, { Meta.expression.id eq id.toInt() })
            Name_rule -> service.delete(Meta.rule, { Meta.rule.id eq id })
            Name_ruleGroup -> service.delete(Meta.ruleGroup, { Meta.ruleGroup.id eq id })
            Name_action -> service.delete(Meta.ruleAction, { Meta.ruleAction.id eq id.toInt() })
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
        val ids = batchParams.ids.split(",")

        if (ids.isEmpty())
            return DataBox.ko("batchOperation: invalid parameter: no name or ids")

        return when (batchParams.action) {
            "del" -> DataBox.ok(batchDel(name, ids))
            else -> DataBox.ko("batchOperation: not support action: ${batchParams.action}")
        }
    }

    private fun batchDel(name: String, ids: List<String>): Long {
        val count = when (name) {
            Name_domain -> service.delete(Meta.domain, { Meta.domain.id inList ids.map{it.toInt()} })
            Name_param -> service.delete(Meta.param, { Meta.param.id inList ids.map{it.toInt()} })
            Name_paramType -> service.delete(Meta.paramType, { Meta.paramType.id inList ids.map{it.toInt()} })
            Name_constant -> service.delete(Meta.constant, { Meta.constant.id inList ids.map{it.toInt()} })
            Name_operator -> service.delete(Meta.operator, { Meta.operator.id inList ids.map{it.toInt()} })
            Name_expression -> service.delete(Meta.expression, { Meta.expression.id inList ids.map{it.toInt()} })
            Name_rule -> service.delete(Meta.rule, { Meta.rule.id inList ids })
            Name_ruleGroup -> service.delete(Meta.ruleGroup, { Meta.ruleGroup.id inList ids })
            Name_action -> service.delete(Meta.ruleAction, { Meta.ruleAction.id inList ids.map{it.toInt()} })
            else -> {
                log.warn("batchOperation: Not support $name in batchDel")
                0L
            }
        }
        return count
    }

    fun initDictDataInDb(): String{
        val map = mutableMapOf<String, Operator>()
        //将系统内置支持的操作符写入数据库，并构建map
        EnumOp.values()
            .map{ Operator(it.label, it.name, it.remark) }
            .let { service.batchSave(Meta.operator, it, true) }
            .forEach { map[it.code] = it }

        EnumCollectionOp.values()
            .map{ Operator(it.label, it.name, it.remark) }
            .let { service.batchSave(Meta.operator, it, true) }
            .forEach { map[it.code] = it }

        EnumLogicalOp.values()
            .map{ Operator(it.label, it.name, it.remark) }
            .let { service.batchSave(Meta.operator, it, true) }
            .forEach { map[it.code] = it }

        //构建内置数据类型并插入库
        val list = listOf(
            ParamType(StringType.label, StringType.code, StringType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),true),
            ParamType(IntType.label, IntType.code, IntType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),true),
            ParamType(LongType.label, LongType.code, LongType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),true),
            ParamType(DoubleType.label, DoubleType.code, DoubleType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),true),
            ParamType(DateTimeType.label, DateTimeType.code, DateTimeType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),true),
            ParamType(BoolType.label, BoolType.code, BoolType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),true),
            ParamType(StringSetType.label, StringSetType.code, StringSetType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),false),
            ParamType(IntSetType.label, IntSetType.code, IntSetType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),false),
            ParamType(LongSetType.label, LongSetType.code, LongSetType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),false),
            ParamType(DoubleSetType.label, DoubleSetType.code, DoubleSetType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),false),
            ParamType(DateTimeSetType.label, DateTimeSetType.code, DateTimeSetType.supportOperators().mapNotNull{map[it]?.id}.joinToString(","),false),
        )
        val types = service.batchSave(Meta.paramType, list, true)

        val opsJson = ApiJson.serverSerializeJson.encodeToString(map)
        val typesJson = ApiJson.serverSerializeJson.encodeToString(types)
        return "opsJson=$opsJson, typesJson=$typesJson"
    }



}


