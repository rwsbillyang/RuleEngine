/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-09-28 16:43
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

import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import org.komapper.core.dsl.Meta

class RuleTreeController : KoinComponent {
    private val service: BaseCrudService by inject()

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