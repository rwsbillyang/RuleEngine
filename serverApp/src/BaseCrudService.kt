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



import com.github.rwsbillyang.ktorKit.cache.ICache
import com.github.rwsbillyang.ktorKit.db.SqlGenericService
import org.komapper.core.dsl.Meta


/**
 * 一个service实现了对各个model的crud的处理，添加新的model时，需将model放到EnumMeta中
 * 若需自定义功能，可在子类中实现
 * */
open class BaseCrudService(cache: ICache): SqlGenericService(bizModule.dbName!!, cache){


    /**
     * 构建RuleCommon树，构建顶层节点时调用
     *
     * 数据库中的字段转换成给前端展示需要的字段
     * pair的第一个参数为id tree path，第2个参数为转换为RuleCommon后的children
     * */
    fun getChildrenTree(ruleType: RuleType, id: Int, ruleChildrenIds: String?, ruleGroupChildrenIds: String?, parentPath: MutableList<String>?): Pair<List<String>, List<RuleCommon>?>{

        //为前端构造tree型列表展示
        val myPath = parentPath?: mutableListOf() //顶级节点负责创建path
        myPath.add("${ruleType.name}-$id")//将当前节点id添加进path，子节点中递归调用时，都将当前id加入，形成parentPath

        val list = myPath.toList()//记录下parentPath，相当于copy

        //为前端构造tree型列表展示
        if(!ruleChildrenIds.isNullOrEmpty() || !ruleGroupChildrenIds.isNullOrEmpty()){
            val children = mutableListOf<RuleCommon>()
            ruleChildrenIds?.split(",")?.forEach{
                val r = findOne(Meta.rule, {Meta.rule.id eq it.toInt()}, "rule/${it}")?.toRuleCommon(this, TableChildrenMode.Tree, myPath)
                if(r != null) children.add(r)
            }
            ruleGroupChildrenIds?.split(",")?.forEach{
                val r = findOne(Meta.ruleGroup, {Meta.ruleGroup.id eq it.toInt()}, "ruleGroup/${it}")?.toRuleCommon(this, TableChildrenMode.Tree, myPath)
                if(r != null) children.add(r)
            }

//            val log = LoggerFactory.getLogger("Rule")
//            log.info("id=$id, myPath:${list.joinToString(",")}")

            myPath.removeLast()//返回时出栈，从子节点中递归时删除当前，避免从子节点返回时，仍然在path中有子节点id
            return Pair(list, children.toList())
        }

        myPath.removeLast()//返回时出栈，从子节点中递归时删除当前，避免从子节点返回时，仍然在path中有子节点id
        return Pair(list, null)
    }


    /**
     * 获取children列表，若lazyLoad为true返回空列表，若为false则加载chidlren；若无chidlren ids返回null
     * */
    fun getChildrenList(ruleChildrenIds: String?, ruleGroupChildrenIds: String?, loadChildren: Boolean): List<RuleCommon>?{
        if(!ruleChildrenIds.isNullOrEmpty() || !ruleGroupChildrenIds.isNullOrEmpty()){
            if(loadChildren){
                val children = mutableListOf<RuleCommon>()
                ruleChildrenIds?.split(",")?.forEach{
                    val r = findOne(Meta.rule, { Meta.rule.id eq it.toInt()}, "rule/${it}")?.toRuleCommon(this, TableChildrenMode.LazyLoad, null)
                    if(r != null) children.add(r)
                }

                ruleGroupChildrenIds?.split(",")?.forEach{
                    val r = findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq it.toInt()}, "ruleGroup/${it}")?.toRuleCommon(this, TableChildrenMode.LazyLoad, null)
                    if(r != null) children.add(r)
                }
                return children
            }else{
                return listOf()
            }
        }
        return null
    }
}