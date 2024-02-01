/*
 * ```
 * Copyright © 2024 rwsbillyang@qq.com.  All Rights Reserved.
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2024-02-01 12:01
 *
 * NOTICE:
 * This software is protected by China and U.S. Copyright Law and International Treaties.
 * Unauthorized use, duplication, reverse engineering, any form of redistribution,
 * or use in part or in whole other than by prior, express, printed and signed license
 * for use is subject to civil and criminal prosecution. If you have received this file in error,
 * please notify copyright holder and destroy this and any other copies as instructed.
 * ```
 */

package com.github.rwsbillyang.rule.composer.dev

import com.github.rwsbillyang.ktorKit.server.respondBoxKO
import com.github.rwsbillyang.ktorKit.server.respondBoxOK
import com.github.rwsbillyang.rule.composer.BaseCrudController
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import org.koin.ktor.ext.inject

fun Routing.devApi() {
    val crudController: BaseCrudController by inject()

    route("/api/dev"){
        //初始化数据库： http://localhost:18000/api/dev/initDbMeta
        //truncate table `t_param_type`;  truncate table `t_opcode`;
        get("/initDbMeta"){
            call.respondBoxOK(InitDbController(crudController.service).initMetaDataInDb())
        }

        //http://localhost:18000/api/dev/upsertZwRRtExt
        get("/upsertZwRRtExt"){
            call.respondBoxOK(InitDbController(crudController.service).upsertZwRRtExt())
        }
        get("/upsertZwConstants"){
            call.respondBoxOK(InitDbController(crudController.service).upsertConstants())
        }
        //http://localhost:18000/api/dev/migrateRuleIntoSqllite
        get("/migrateRuleIntoSqllite"){
            call.respondBoxOK(RuleMigrateController(crudController.service).dropCreateTableAndMigrate())
        }
        //http://localhost:18000/api/dev/tmp/modifyRuleFileds
        get("/tmp/modifyRuleFileds"){
            call.respondBoxOK(RuleMigrateController(crudController.service).modifyRuleFileds())
        }
        //http://localhost:18000/api/dev/runRuleExprCheck?lastId=596
        get("/runRuleExprCheck"){
            val lastId = call.request.queryParameters["lastId"]?.toInt()
            call.respondBoxOK(RuleMigrateController(crudController.service).runRuleExprCheck(lastId))
        }


        //============== for App Client ===================//
        //app获取birthInfo最后一条记录的id，然后增量上传，回流到开发环境sqlite数据库
        get("/birthInfoLastId"){
            call.respondBoxOK(HelpBooksController(crudController.service).getBirthInfoLastId())
        }
        //APP回流helpBooks到开发环境sqlite数据库：更新等数据至app源码的assets下的db
        post("/updateList/{name}"){
            val name = call.parameters["name"]
            if(name == null)
                call.respondBoxKO("delSubInRuleGroup, invalid parameter: no name")
            else{
                val controller = HelpBooksController(crudController.service)

                val result = when(name){
                    "JuniorBookStar" -> controller.updateJuniorBookStar(call.receive())
                    "SeniorBookStar" -> controller.updateSeniorBookStar(call.receive())
                    "SixtyStarSerials" -> controller.updateSixtyStarSerials(call.receive())
                    "JuniorBookGongYuan" -> controller.updateJuniorBookGongYuan(call.receive())
                    "SeniorBookGongYuan" -> controller.updateSeniorBookGongYuan(call.receive())
                    "LbzRemark" -> controller.updateLbzRemark(call.receive())
                    "BirthInfo" -> controller.updateBirthInfo(call.receive())
                    else -> null
                }
                if(result == null) call.respondBoxKO("not support name: $name")
                else call.respondBoxOK(result)
            }
        }

        get("/ruleList"){
            val lastId = call.request.queryParameters["lastId"]
            val pageSize = call.request.queryParameters["pageSize"]?.toInt()?:20
            val domainId = call.request.queryParameters["domainId"]?.toInt()?:1

            val controller = HelpBooksController(crudController.service)
            val list = controller.getRulePage(lastId, pageSize, domainId)
            call.respondBoxOK(list)
        }
        get("/ruleGroupList"){
            val lastId = call.request.queryParameters["lastId"]
            val pageSize = call.request.queryParameters["pageSize"]?.toInt()?:20
            val domainId = call.request.queryParameters["domainId"]?.toInt()?:1

            val controller = HelpBooksController(crudController.service)
            val list = controller.getRuleGroupPage(lastId, pageSize, domainId)
            call.respondBoxOK(list)
        }
    }
}