/*
 * ```
 * Copyright © 2024 rwsbillyang@qq.com.  All Rights Reserved.
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2024-04-22 14:21
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
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import org.koin.ktor.ext.inject

fun Routing.devApi() {
    val runRuleController: RunRuleController by inject()
    val initDbController: InitDbController by inject()
    val ruleMigrateController: RuleMigrateController by inject()
    val helpBooksController: HelpBooksController by inject()

    route("/api/dev"){
        //初始化数据库： http://localhost:18000/api/dev/initDbMeta
        //truncate table `t_param_type`;  truncate table `t_opcode`;
        get("/initDbMeta"){
            call.respondBoxOK(initDbController.initMetaDataInDb())
        }

        //http://localhost:18000/api/dev/upsertZwRRtExt
        get("/upsertZwRRtExt"){
            call.respondBoxOK(initDbController.upsertZwRRtExt())
        }
        get("/upsertZwConstants"){
            call.respondBoxOK(initDbController.upsertConstants())
        }
        //http://localhost:18000/api/dev/migrateRuleIntoSqllite
        get("/migrateRuleIntoSqllite"){
            call.respondBoxOK(ruleMigrateController.dropCreateTableAndMigrate())
        }
        //http://localhost:18000/api/dev/tmp/modifyRuleFileds
        get("/tmp/modifyRuleFileds"){
            call.respondBoxOK(ruleMigrateController.modifyRuleFileds())
        }
        //http://localhost:18000/api/dev/runRuleExprCheck?lastId=596
        get("/runRuleExprCheck"){
            val lastId = call.request.queryParameters["lastId"]?.toInt()
            call.respondBoxOK(ruleMigrateController.runRuleExprCheck(lastId))
        }

        //http://localhost:18000/api/dev/runRule?id=23
        get("/runRule"){
            val ruleId = call.request.queryParameters["id"]?.toInt() //ruleId
            if(ruleId == null)
                call.respondBoxKO("no id of rule")
            else
                call.respondBoxOK(runRuleController.runRule(ruleId))
        }

        //============== for App Client ===================//
        //app获取birthInfo最后一条记录的id，然后增量上传，回流到开发环境sqlite数据库
        get("/birthInfoLastId"){
            call.respondBoxOK(helpBooksController.getBirthInfoLastId())
        }
        //APP回流helpBooks到开发环境sqlite数据库：更新等数据至app源码的assets下的db
        post("/updateList/{name}"){
            val name = call.parameters["name"]
            if(name == null)
                call.respondBoxKO("delSubInRuleGroup, invalid parameter: no name")
            else{

                val result = when(name){
                    "JuniorBookStar" -> helpBooksController.updateJuniorBookStar(call.receive())
                    "SeniorBookStar" -> helpBooksController.updateSeniorBookStar(call.receive())
                    "SixtyStarSerials" -> helpBooksController.updateSixtyStarSerials(call.receive())
                    "JuniorBookGongYuan" -> helpBooksController.updateJuniorBookGongYuan(call.receive())
                    "SeniorBookGongYuan" -> helpBooksController.updateSeniorBookGongYuan(call.receive())
                    "LbzRemark" -> helpBooksController.updateLbzRemark(call.receive())
                    "BirthInfo" -> helpBooksController.updateBirthInfo(call.receive())
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

            val list = helpBooksController.getRulePage(lastId, pageSize, domainId)
            call.respondBoxOK(list)
        }
        get("/ruleGroupList"){
            val lastId = call.request.queryParameters["lastId"]
            val pageSize = call.request.queryParameters["pageSize"]?.toInt()?:20
            val domainId = call.request.queryParameters["domainId"]?.toInt()?:1

            val list = helpBooksController.getRuleGroupPage(lastId, pageSize, domainId)
            call.respondBoxOK(list)
        }
    }
}