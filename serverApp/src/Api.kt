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



import com.github.rwsbillyang.ktorKit.apiBox.BatchOperationParams
import com.github.rwsbillyang.ktorKit.apiBox.DataBox
import com.github.rwsbillyang.ktorKit.server.*


import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.resources.*
import io.ktor.server.routing.*
import io.ktor.server.routing.get
import kotlinx.serialization.encodeToString
import org.koin.dsl.module
import org.koin.ktor.ext.inject
import org.komapper.core.dsl.Meta

val bizModule = AppModule(
    listOf(
        module {
            single { BaseCrudService(get()) }
            single { BaseCrudController() }
        }),
    "ruleEngineDb"
) {
    composerApi()
}

fun Routing.composerApi() {
    val crudController: BaseCrudController by inject()
    //val erpBaseCrudService: ErpBaseCrudService by inject()

    route("/api/rule/composer"){
        route("/list"){
            get<ParameterQueryParams>{
                call.respondBoxJsonText(crudController.findPage(BaseCrudController.Name_param, it))
            }
            get<ParameterTypeQueryParams>{
                call.respondBoxJsonText(crudController.findPage(BaseCrudController.Name_paramType, it))
            }
            get<ValueConstantQueryParams>{
                call.respondBoxJsonText(crudController.findPage(BaseCrudController.Name_constant, it))
            }
            get<OperatorQueryParams>{
                call.respondBoxJsonText(crudController.findPage(BaseCrudController.Name_operator, it))
            }
            get<ExpressionQueryParams>{
                call.respondBoxJsonText(crudController.findPage(BaseCrudController.Name_expression, it))
            }
            get<DomainQueryParams>{
                call.respondBoxJsonText(crudController.findPage(BaseCrudController.Name_domain, it))
            }
            get<RuleQueryParams>{
                call.respondBoxJsonText(crudController.findPage(BaseCrudController.Name_rule, it))
            }
            get<RuleGroupQueryParams>{
                call.respondBoxJsonText(crudController.findPage(BaseCrudController.Name_ruleGroup, it))
            }
            get<ActionQueryParams>{
                call.respondBoxJsonText(crudController.findPage(BaseCrudController.Name_action, it))
            }
        }

        get("/get/{name}/{id}"){
            val id = call.parameters["id"]?.toInt()
            val name = call.parameters["name"]
            if(id == null || name == null)
                call.respondBoxKO("invalid parameter: no name or id")
            else
            {
                try {
                    call.respondBoxJsonText(crudController.findOne(name, id))
                }catch (e: IllegalArgumentException){
                    call.respondBoxKO("invalid parameter, not support: $name")
                }
            }
        }
        /**
         * insert/update
         * */
        post("/save/{name}") {
            val name = call.parameters["name"]
            if(name == null)
                call.respondBoxKO("invalid parameter: no name")
            else{
                try {
                    call.respondBoxJsonText(crudController.saveOne(name, call))
                }catch (e: IllegalArgumentException){
                    e.printStackTrace()
                    call.respondBoxKO("IllegalArgumentException when save: $name")
                }
            }
        }

        /**
         * 删除
         * */
        get("/del/{name}/{id}"){
            val id = call.parameters["id"]?.toInt()
            val name = call.parameters["name"]
            if(id == null || name == null)
                call.respondBoxKO("invalid parameter: no name or id")
            else
            {
                try {
                    call.respondBox(crudController.delOne(name, id))
                }catch (e: IllegalArgumentException){
                    call.respondBoxKO("invalid parameter, not support: $name")
                }
            }
        }

        /**
         * 批量操作，目前只支持：fakeDel，post请求
         * body: {ids:[123], action: "del", arg1: "name" }
         * */
        post("/batchOperation"){
            val params = call.receive<BatchOperationParams>()
            val name = params.arg1

            if(name == null)
                call.respondBoxKO("invalid parameter: no name")
            else
            {
                try {
                    call.respondBox(crudController.batchOperation(name,params))
                }catch (e: IllegalArgumentException){
                    call.respondBoxKO("invalid parameter, not support: $name")
                }
            }
        }



        post("/saveSubInRule/{name}/{parentRuleId}") {
            val name = call.parameters["name"]
            val parentRuleId = call.parameters["parentRuleId"]?.toInt()
            if(name == null || parentRuleId == null )
                call.respondBoxKO("saveSubInRule, invalid parameter: no name/parentRuleId")
            else{
                try {
                    val text = when(name){
                        BaseCrudController.Name_rule -> {
                            val e = call.receive<Rule>()
                            MySerializeJson.encodeToString(DataBox.ok(crudController.saveRuleInParentRule(e, parentRuleId)))
                        }
                        BaseCrudController.Name_ruleGroup -> {
                            val e = call.receive<RuleGroup>()
                            MySerializeJson.encodeToString(DataBox.ok(crudController.saveRuleGroupInParentRule(e, parentRuleId)))
                        }
                        else -> MySerializeJson.encodeToString(DataBox.ko<Int>("saveSubInRule: not support $name"))
                    }
                    call.respondBoxJsonText(text)
                }catch (e: IllegalArgumentException){
                    e.printStackTrace()
                    call.respondBoxKO("saveSubInRule IllegalArgumentException when save: $name")
                }
            }
        }
        post("/saveSubInRuleGroup/{name}/{parentRuleGroupId}") {
            val name = call.parameters["name"]
            val parentRuleGroupId = call.parameters["parentRuleGroupId"]?.toInt()
            if(name == null || parentRuleGroupId == null)
                call.respondBoxKO("saveSubInRuleGroup: invalid parameter: no name/parentRuleGroupId")
            else{
                try {
                    val text = when(name){
                        BaseCrudController.Name_rule -> {
                            val e = call.receive<Rule>()
                            MySerializeJson.encodeToString(DataBox.ok(crudController.saveRuleInParentRuleGroup(e, parentRuleGroupId)))
                        }
                        BaseCrudController.Name_ruleGroup -> {
                            val e = call.receive<RuleGroup>()
                            MySerializeJson.encodeToString(DataBox.ok(crudController.saveRuleGroupInParentRuleGroup(e, parentRuleGroupId)))
                        }
                        else -> MySerializeJson.encodeToString(DataBox.ko<Int>("saveSubInRuleGroup: not support $name"))
                    }
                    call.respondBoxJsonText(text)
                }catch (e: IllegalArgumentException){
                    e.printStackTrace()
                    call.respondBoxKO("saveSubInRuleGroup, IllegalArgumentException when save: $name")
                }
            }
        }
        get("/delSubInParentRule/{name}/{id}/{parentRuleId?}") {
            val name = call.parameters["name"]
            val parentRuleId = call.parameters["parentRuleId"]?.toInt()
            val id = call.parameters["id"]?.toInt()
            if(name == null || id == null)
                call.respondBoxKO("delSubInRule, invalid parameter: no name/id")
            else{
                try {
                    val count = when(name){
                        BaseCrudController.Name_rule -> {
                            crudController.removeRuleInParentRule(id, parentRuleId)
                        }
                        BaseCrudController.Name_ruleGroup -> {
                            crudController.removeRuleGroupInParentRule(id, parentRuleId)
                        }
                        else -> 0L
                    }
                    call.respondBoxOK(count)
                }catch (e: IllegalArgumentException){
                    e.printStackTrace()
                    call.respondBoxKO("delSubInRule IllegalArgumentException when del: $name")
                }
            }
        }
        get("/delSubInParentGroup/{name}/{id}/{parentRuleGroupId?}") {
            val name = call.parameters["name"]
            val parentRuleGroupId = call.parameters["parentRuleGroupId"]?.toInt()
            val id = call.parameters["id"]?.toInt()
            if(name == null || id == null)
                call.respondBoxKO("delSubInRuleGroup, invalid parameter: no name/id")
            else{
                try {
                    val count = when(name){
                        BaseCrudController.Name_rule -> {
                            crudController.removeRuleInParentRuleGroup(id, parentRuleGroupId)
                        }
                        BaseCrudController.Name_ruleGroup -> {
                            crudController.removeRuleGroupInParentRuleGroup(id, parentRuleGroupId)
                        }
                        else -> 0L
                    }
                    call.respondBoxOK(count)
                }catch (e: IllegalArgumentException){
                    e.printStackTrace()
                    call.respondBoxKO("delSubInRuleGroup IllegalArgumentException when del: $name")
                }
            }
        }



        //初始化数据库： http://localhost:18000/api/rule/composer/initDb
        get("/initDb"){
            call.respondBoxOK(crudController.initDictDataInDb())
        }
    }
}
