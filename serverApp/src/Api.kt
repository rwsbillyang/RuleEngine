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
import com.github.rwsbillyang.ktorKit.server.*


import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.resources.*
import io.ktor.server.routing.*
import io.ktor.server.routing.get
import org.koin.dsl.module
import org.koin.ktor.ext.inject

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
            val id = call.parameters["id"]
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
            val id = call.parameters["id"]
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


        //初始化数据库： http://localhost:18000/api/rule/composer/initDb
        get("/initDb"){
            call.respondBoxOK(crudController.initDictDataInDb())
        }
    }
}

