/*
 * ```
 * Copyright © 2023 rwsbillyang@qq.com.  All Rights Reserved.
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-12-26 12:34
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


import com.github.rwsbillyang.rule.composer.rule
import org.komapper.core.dsl.Meta


fun main(){
    //update t_rule set `rule_parent_ids` = null, `rule_children_ids` = null, `rule_group_children_ids`=null, tags=null, then_action=null, else_action=null where id>;
    //update t_rule set `expr_remark` = null where id> and `expr_remark`="";
   // println((1216..1264).joinToString(",") { it.toString() })
    modifyRuleFileds()
}


fun modifyRuleFileds(){
    val service = MyBaseCrudService2()

    service.findAll(Meta.rule, { Meta.rule.id greaterEq 844}).forEach {
        service.updateValues(Meta.rule, {
            Meta.rule.label eq it.description
            Meta.rule.exprRemark eq it.label
            Meta.rule.description eq it.exprRemark
        }, {Meta.rule.id eq it.id})
    }
}








