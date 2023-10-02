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
import org.slf4j.LoggerFactory

class RuleTreeController : KoinComponent {
    private val log = LoggerFactory.getLogger("RuleTreeController")
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

        addRelation_RuleInRule(newOne.id!!, parentRuleId)

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

        addRelation_GroupInRule(newOne.id!!, parentRuleId)

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

        addRelation_GroupInGroup(newOne.id!!, parentRuleGroupId)

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

        addRelation_RuleInGroup(newOne.id!!, parentRuleGroupId)

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
            removeRelation_RuleInRule(rule, parentRuleId)
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
            removeRelation_GroupInRule(ruleGroup, parentRuleId)
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
            removeRelation_GroupInGroup(ruleGroup, parentRuleGroupId)
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
            removeRelation_RuleInGroup(rule, parentRuleGroupId)
        }

        return count
    }

    /**
     * 将当前rule或ruleGroup移动到新的rule或RuleGroup下
     * 先解除亲子关系，再重新建立新的亲子关系
     * */
    public fun moveRuleCommonIntoNewParent(p: MoveParam): Int {
        when(p.current.type){
            RuleType.rule -> {
                val rule = service.findOne(Meta.rule, { Meta.rule.id eq p.current.id }, "rule/${p.current.id}")
                if (rule == null) {
                    log.warn("no child rule, id=${p.current.id} when move")
                    return 0
                }

                var parentGroupIds = rule.ruleGroupParentIds
                var parentRuleIds = rule.ruleParentIds
                if(p.oldParent != null){
                    when(p.oldParent.type){
                        RuleType.rule -> {
                            parentRuleIds = removeId(parentRuleIds, p.oldParent.id)
                            removeRelation_RuleInRule(rule, p.oldParent.id, false)
                        }
                        RuleType.ruleGroup -> {
                            parentGroupIds = removeId(parentGroupIds, p.oldParent.id)
                            removeRelation_RuleInGroup(rule, p.oldParent.id, false)
                        }
                    }
                }
                if(p.newParent != null){
                    when(p.newParent.type){
                        RuleType.rule -> {
                            parentRuleIds = addId(parentRuleIds, p.newParent.id)
                            addRelation_RuleInRule(p.current.id, p.newParent.id)
                        }
                        RuleType.ruleGroup -> {
                            parentGroupIds = addId(parentGroupIds, p.newParent.id)
                            addRelation_RuleInGroup(p.current.id, p.newParent.id)
                        }
                    }
                }

                // 更新父节点信息
                service.updateValues(
                    Meta.rule,
                    {
                        Meta.rule.ruleParentIds eq parentRuleIds
                        Meta.rule.ruleGroupParentIds eq parentGroupIds
                    },
                    { Meta.rule.id eq p.current.id },
                    "rule/${p.current.id}"
                )
                return 1
            }

            RuleType.ruleGroup -> {
                val ruleGroup = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq p.current.id }, "ruleGroup/${p.current.id}")
                if (ruleGroup == null) {
                    log.warn("no child ruleGroup, id=${p.current.id} when move")
                    return 0
                }

                var parentGroupIds = ruleGroup.ruleGroupParentIds
                var parentRuleIds = ruleGroup.ruleParentIds
                if(p.oldParent != null){
                    when(p.oldParent.type){
                        RuleType.rule -> {
                            parentRuleIds = removeId(parentRuleIds, p.oldParent.id)
                            removeRelation_GroupInRule(ruleGroup, p.oldParent.id, false)
                        }
                        RuleType.ruleGroup -> {
                            parentGroupIds = removeId(parentGroupIds, p.oldParent.id)
                            removeRelation_GroupInGroup(ruleGroup, p.oldParent.id, false)
                        }
                    }
                }
                if(p.newParent != null){
                    when(p.newParent.type){
                        RuleType.rule -> {
                            parentRuleIds = addId(parentRuleIds, p.newParent.id)
                            addRelation_RuleInRule(p.current.id, p.newParent.id)
                        }
                        RuleType.ruleGroup -> {
                            parentGroupIds = addId(parentGroupIds, p.newParent.id)
                            addRelation_RuleInGroup(p.current.id, p.newParent.id)
                        }
                    }
                }

                // 更新父节点信息
                service.updateValues(
                    Meta.rule,
                    {
                        Meta.rule.ruleParentIds eq parentRuleIds
                        Meta.rule.ruleGroupParentIds eq parentGroupIds
                    },
                    { Meta.rule.id eq p.current.id },
                    "rule/${p.current.id}"
                )
                return 1
            }
        }
    }

    /**
     * 将id添加父节点的chidlren中
     * @param id 子rule id
     * @param parentRuleId 父rule id
     * */
    private fun addRelation_RuleInRule(id: Int, parentRuleId: Int): Int{
        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentRuleId }, "rule/$parentRuleId")
        return if (parent == null) {
            log.warn("no parentRule,Id=$parentRuleId when addRelation_RuleInRule")
            0
        } else {
            //更新父Rule的子rule节点：从父rule的ruleChildrenIds中移出id并更新父rule
            val ruleChildrenIds = addId(parent.ruleChildrenIds, id)
            if (ruleChildrenIds != parent.ruleChildrenIds) {
                service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.rule.id eq parentRuleId },
                    "rule/$parentRuleId"
                ).toInt()
            }else 0
        }
    }

    /**
     * 去除父节点中的chidlren信息，子节点中的parent信息更新由updateChild决定
     * @param rule 子节点
     * @param parentId 父节点id
     * @param updateChild 是否更新子节点的 parentIds信息
     * */
    private fun removeRelation_RuleInRule(rule: Rule, parentId: Int, updateChild: Boolean = true){
        val id = rule.id!!
        if(updateChild){
            val ruleParentIds = removeId(rule.ruleParentIds, parentId)
            if (ruleParentIds != rule.ruleParentIds) {
                service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleParentIds eq ruleParentIds },
                    { Meta.rule.id eq id },
                    "rule/$id"
                )
            }
        }

        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentId }, "rule/$parentId")
        if (parent == null) {
            log.warn("no old parentRuleId=$parentId when changeRelation_RuleInRule")
        } else {
            //更新父Rule的子rule节点：从父rule的ruleChildrenIds中移出id并更新父rule
            val ruleChildrenIds = removeId(parent.ruleChildrenIds, id)
            if (ruleChildrenIds != parent.ruleChildrenIds) {
                service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.rule.id eq parentId },
                    "rule/$parentId"
                )
            }
        }
    }

    /**
     * 将id添加父节点的chidlren中
     * @param id 子rule id
     * @param parentRuleGroupId 父ruleGroup id
     * */
    private fun addRelation_RuleInGroup(id: Int, parentRuleGroupId: Int): Int{
        val parent =
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq parentRuleGroupId }, "ruleGroup/$parentRuleGroupId")
        return if (parent == null) {
            log.warn("no parentRuleGroup, parentRuleGroupId=$parentRuleGroupId when addRelation_RuleInGroup")
            0
        } else {
            //更新父RuleGroup的子rule节点：在父ruleGroup的ruleChildrenIds中添加id并更新父ruleGroup
            val ruleChildrenIds = addId(parent.ruleChildrenIds, id)
            if (ruleChildrenIds != parent.ruleChildrenIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.ruleGroup.id eq parentRuleGroupId },
                    "ruleGroup/$parentRuleGroupId"
                ).toInt()
            }else 0
        }
    }
    /**
     * 去除父节点中的chidlren信息，子节点中的parent信息更新由updateChild决定
     * @param rule 子节点
     * @param parentId 父节点id
     * @param updateChild 是否更新子节点的 parentIds信息
     * */
    private fun removeRelation_RuleInGroup(rule: Rule, parentId: Int, updateChild: Boolean = true){
        val id = rule.id!!
        if(updateChild){
            val ruleGroupParentIds = removeId(rule.ruleGroupParentIds, parentId)
            if (ruleGroupParentIds != rule.ruleGroupParentIds) {
                service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleGroupParentIds eq ruleGroupParentIds },
                    { Meta.rule.id eq id },
                    "rule/$id"
                )
            }
        }

        val parent = service.findOne(
            Meta.ruleGroup,
            { Meta.ruleGroup.id eq parentId },
            "ruleGroup/$parentId"
        )
        if (parent == null) {
            log.warn("no parentRuleGroup, parentRuleGroupId=$parentId when removeRelation")
        } else {
            //更新父RuleGroup的子rule节点：从父RuleGroup的ruleChildrenIds中移出id并更新父RuleGroup
            val ruleChildrenIds = removeId(parent.ruleChildrenIds, id)
            if (ruleChildrenIds != parent.ruleChildrenIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.ruleGroup.id eq parentId },
                    "ruleGroup/$parentId"
                )
            }
        }
    }

    /**
     * 将id添加父节点的chidlren中
     * @param id 子group id
     * @param parentRuleId 父rule id
     * */
    private fun addRelation_GroupInRule(id: Int, parentRuleId: Int): Int{
        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentRuleId }, "rule/$parentRuleId")
        return if (parent == null) {
            log.warn("no parentRule, parentRuleId=$parentRuleId when del")
            0
        } else {
            //更新父Rule的子ruleGroup节点：在父rule的ruleGroupChildrenIds中添加id并更新父rule
            val ruleGroupChildrenIds = addId(parent.ruleGroupChildrenIds, id)
            if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.rule.id eq parentRuleId },
                    "rule/$parentRuleId"
                ).toInt()
            }else 0
        }
    }


    /**
     * 去除父节点中的chidlren信息，子节点中的parent信息更新由updateChild决定
     * @param ruleGroup 子节点
     * @param parentId 父节点id
     * @param updateChild 是否更新子节点的 parentIds信息
     * */
    private fun removeRelation_GroupInRule(ruleGroup: RuleGroup, parentId: Int, updateChild: Boolean = true){
        val id = ruleGroup.id!!
        if(updateChild){
            val ruleParentIds = removeId(ruleGroup.ruleParentIds, parentId)
            if (ruleParentIds != ruleGroup.ruleParentIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleParentIds eq ruleParentIds },
                    { Meta.ruleGroup.id eq id },
                    "ruleGroup/$id"
                )
            }
        }

        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentId }, "rule/$parentId")
        if (parent == null) {
            log.warn("no parentRule, parentRuleId=$parentId when removeRelation")
        } else {
            //更新父Rule的子group节点：从父rule的ruleGroupChildrenIds中移出id并更新父rule
            val ruleGroupChildrenIds = removeId(parent.ruleGroupChildrenIds, id)
            if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.rule.id eq parentId },
                    "rule/$parentId"
                )
            }
        }
    }

    /**
     * 将id添加父节点的chidlren中
     * @param id 子group id
     * @param parentRuleId 父ruleGroup id
     * */
    private fun addRelation_GroupInGroup(id: Int, parentRuleGroupId: Int): Int{
        val parent =
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq parentRuleGroupId }, "ruleGroup/$parentRuleGroupId")
        return if (parent == null) {
            log.warn("no parentRuleGroup, parentRuleGroupId=$parentRuleGroupId when addRelation_GroupInGroup")
            0
        } else {
            //更新父RuleGroup的子ruleGroup节点：在父rule的ruleGroupChildrenIds中添加id并更新父rule
            val ruleGroupChildrenIds = addId(parent.ruleGroupChildrenIds, id)
            if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.ruleGroup.id eq parentRuleGroupId },
                    "ruleGroup/$parentRuleGroupId"
                ).toInt()
            }else 0
        }
    }

    /**
     * 去除父节点中的chidlren信息，子节点中的parent信息更新由updateChild决定
     * @param ruleGroup 子节点
     * @param parentId 父节点id
     * @param updateChild 是否更新子节点的 parentIds信息
     * */
    private fun removeRelation_GroupInGroup(ruleGroup: RuleGroup, parentId: Int, updateChild: Boolean = true) {
        //更新子ruleGroup的父group节点: 从rule的ruleParentIds中移出parentRuleId并更新ruleGroup
        val id = ruleGroup.id!!
        if(updateChild){
            val ruleGroupParentIds = removeId(ruleGroup.ruleGroupParentIds, parentId)
            if (ruleGroupParentIds != ruleGroup.ruleGroupParentIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleGroupParentIds eq ruleGroupParentIds },
                    { Meta.ruleGroup.id eq id },
                    "ruleGroup/$id"
                )
            }
        }

        val parent =
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq parentId }, "rule/$parentId")
        if (parent == null) {
            log.warn("no parentRuleGroup, parentRuleGroupId=$parentId when removeRelation")
        } else {
            //更新父RuleGroup子group节点：从父RuleGroup的ruleGroupChildrenIds中移出id并更新父RuleGroup
            val ruleGroupChildrenIds = removeId(parent.ruleGroupChildrenIds, id)
            if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.ruleGroup.id eq parentId },
                    "ruleGroup/$parentId"
                )
            }
        }
    }
}