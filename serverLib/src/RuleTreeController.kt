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
    fun saveRuleInRule(rule: Rule, parentRuleId: Int): InsertNodeResult {
        val old = rule.id?.let { service.findOne(Meta.rule, { Meta.rule.id eq it }, "rule/${rule.id}") }
        //更新亲子关系数据，其它3个前端不做变动，仍旧传递回来
        rule.ruleParentIds = addId(old?.ruleParentIds, parentRuleId)
        val newOne = service.save(Meta.rule, rule, old == null, "rule/${rule.id}")

        val children = addChild_RuleInRule(newOne.id!!, parentRuleId)

        //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
        return InsertNodeResult(newOne.toRuleCommon(service, TableChildrenMode.None), RuleAndGroupdIds(children, null))//转换成RuleCommon用于给前端添加到children中，展示到树形列表中
    }
    fun addRuleInRule(ruleId: Int, parentId: Int): InsertNodeResult? {
        val rule =  service.findOne(Meta.rule, { Meta.rule.id eq ruleId }, "rule/${ruleId}")
        if(rule != null){
            //更新亲子关系数据，其它3个前端不做变动，仍旧传递回来
            val ruleParentIds = addId(rule.ruleParentIds, parentId)

            val count = service.updateValues(
                Meta.rule,
                { Meta.rule.ruleParentIds eq ruleParentIds },
                { Meta.rule.id eq ruleId },
                "rule/$ruleId"
            )
            if(count > 0L){
                rule.ruleParentIds = ruleParentIds
                val children = addChild_RuleInRule(ruleId, parentId)
                //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
                return InsertNodeResult(rule.toRuleCommon(service, TableChildrenMode.None), RuleAndGroupdIds(children, null))//转换成RuleCommon用于给前端添加到children中，展示到树形列表中
            }
        }
        return null
    }
   fun addRuleInGroup(ruleId: Int, parentId: Int): InsertNodeResult? {
        val rule =  service.findOne(Meta.rule, { Meta.rule.id eq ruleId }, "rule/${ruleId}")
        if(rule != null){
            //更新亲子关系数据，其它3个前端不做变动，仍旧传递回来
            val ruleParentIds = addId(rule.ruleGroupParentIds, parentId)

            val count = service.updateValues(
                Meta.rule,
                { Meta.rule.ruleGroupParentIds eq ruleParentIds },
                { Meta.rule.id eq ruleId },
                "rule/$ruleId"
            )
            if(count > 0L){
                rule.ruleGroupParentIds = ruleParentIds
                val children = addChild_RuleInGroup(ruleId, parentId)
                //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
                return InsertNodeResult(rule.toRuleCommon(service, TableChildrenMode.None), RuleAndGroupdIds(children, null))//转换成RuleCommon用于给前端添加到children中，展示到树形列表中
            }
        }
        return null
    }

    /**
     * 在rule中插入子rule，亲子关系数据后端维护，前端不做任何变动
     * 插入成功后，返回给前端的数据，前端负责插入到children中，做树形显示
     * @param ruleGroup 待插入或更新的子ruleGroup 若已存在，则修改子ruleGroup新的字段值以及亲子关系
     * @param parentRuleId 父rule的id
     * */
    fun saveGroupInRule(ruleGroup: RuleGroup, parentRuleId: Int): InsertNodeResult {
        val old = if(ruleGroup.id != null)
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq ruleGroup.id }, "ruleGroup/${ruleGroup.id}")
        else null

        ruleGroup.ruleParentIds = addId(old?.ruleChildrenIds, parentRuleId)
        val newOne = service.save(Meta.ruleGroup, ruleGroup, old == null, "ruleGroup/${ruleGroup.id}")

        val children = addChild_GroupInRule(newOne.id!!, parentRuleId)

        //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
        return InsertNodeResult(newOne.toRuleCommon(service, TableChildrenMode.None), RuleAndGroupdIds(null, children))//转换成RuleCommon用于给前端添加到children中，展示到树形列表中
    }

    /**
     * 在rule中插入子ruleGroup，亲子关系数据后端维护，前端不做任何变动
     * 插入成功后，返回给前端的数据，前端负责插入到children中，做树形显示
     * @param ruleGroup 待插入或更新的子ruleGroup 若已存在，则修改子ruleGroup新的字段值以及亲子关系
     * @param parentRuleGroupId 父ruleGroup的id
     * */
    fun saveGroupInGroup(ruleGroup: RuleGroup, parentRuleGroupId: Int): InsertNodeResult {
        val old = if(ruleGroup.id != null)
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq ruleGroup.id }, "ruleGroup/${ruleGroup.id}")
        else null

        ruleGroup.ruleGroupParentIds = addId(old?.ruleGroupParentIds, parentRuleGroupId)
        val newOne = service.save(Meta.ruleGroup, ruleGroup, old == null, "ruleGroup/${ruleGroup.id}")

        val children = addChild_GroupInGroup(newOne.id!!, parentRuleGroupId)

        //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
        return InsertNodeResult(newOne.toRuleCommon(service, TableChildrenMode.None), RuleAndGroupdIds(null, children))//转换成RuleCommon用于给前端添加到children中，展示到树形列表中
    }

    /**
     * 在rule中插入子rule，亲子关系数据后端维护，前端不做任何变动
     * 插入成功后，返回给前端的数据，前端负责插入到children中，做树形显示
     * @param rule 待插入或更新的子rule 若已存在，则修改子rule新的字段值以及亲子关系
     * @param parentRuleGroupId 父ruleGroup的id
     * */
    public fun saveRuleInGroup(rule: Rule, parentRuleGroupId: Int): InsertNodeResult {
        val old = if(rule.id != null)
            service.findOne(Meta.rule, { Meta.rule.id eq rule.id }, "rule/${rule.id}")
        else null

        rule.ruleGroupParentIds = addId(old?.ruleGroupParentIds, parentRuleGroupId)
        val newOne = service.save(Meta.rule, rule, old == null, "rule/${rule.id}")

        val children = addChild_RuleInGroup(newOne.id!!, parentRuleGroupId)

        //并不是从根上进行构建tree,故path只是自己，前端需要结合parent重新构建
        return InsertNodeResult(newOne.toRuleCommon(service, TableChildrenMode.None), RuleAndGroupdIds(children, null)) //转换成RuleCommon用于给前端添加到children中，展示到树形列表中
    }

    /**
     * 从以,分隔的字符串中添加id，并返回添加后新的字符串
     * */
    private fun addId(ids: String?, id: Int?): String? {
        if (id == null) return ids
        if (ids.isNullOrEmpty()) return id.toString()

        val set = ids.split(",").map{it.toInt()}.toMutableSet()
        set.add(id)
        return set.sorted().joinToString(",")
    }

    /**
     * 从以,分隔的字符串中移出id，并返回移出后新的字符串
     * */
    private fun removeId(ids: String?, id: Int): String? {
        if (ids.isNullOrEmpty()) return null
        val set = ids.split(",").map{it.toInt()}.toMutableSet()
        set.remove(id)
        if (set.isEmpty()) return null
        else return set.sorted().joinToString(",")
    }

    /**
     * 删除父rule下的子rule
     *
     * 若是多亲（有父group，或其它父rule），则只拆除亲子关系
     * 若只是单亲，且单亲是parentId：若有孩子，则递归调用删除孩子，若无孩子则删除自己
     *
     * @param id 子rule的id
     * @param parentRuleId 父rule的id 若为空则可能是root级别
     *
     * @return 返回的删除结果，只是包含当前的亲子关系，
     * 不包括循环遍历删除当前节点子孙节点的节点更新情况（实际使用情况目前还没这种情况），此时前端需清除缓存
     * */
    fun removeRuleInRule(id: Int, parentRuleId: Int?):  DelResult? {
        val rule = service.findOne(Meta.rule, { Meta.rule.id eq id }, "rule/$id")
        if (rule == null) {
            log.warn("no child rule, id=$id when del, parentRuleId=$parentRuleId")
            return null
        }

        var count = 0L


        if(parentRuleId != null){
            val ruleParentIds = removeId(rule.ruleParentIds, parentRuleId)
            //没有其它parents，亦即不是其它节点的子节点，递归删除自己及自己的子节点
            if(ruleParentIds.isNullOrEmpty() && rule.ruleGroupParentIds.isNullOrEmpty()){
                //若有孩子，将递归删除孩子及自己
                count += delRuleAndChildrenRecursively(rule)
            }

            //解除父子关系
            removeRelation_RuleInRule(rule, parentRuleId, true)
        }else{
            //没有其它parents，亦即不是其它节点的子节点，递归删除自己及自己的子节点
            if(rule.ruleParentIds.isNullOrEmpty() && rule.ruleGroupParentIds.isNullOrEmpty()){
                //若有孩子，将递归删除孩子及自己
                count += delRuleAndChildrenRecursively(rule)
            }
        }

        return DelResult(count, RuleAndGroupdIds(null,null),RuleAndGroupdIds(null, null))
    }

    /**
     * 删除父rule下的子ruleGroup
     *
     * 若是多亲（有父group，或其它父rule），则只拆除亲子关系
     * 若只是单亲，且单亲是parentId：若有孩子，则递归调用删除孩子，若无孩子则删除自己
     *
     * @param id 子ruleGroup的id
     * @param parentRuleId 父rule的id 若为空则可能是root级别
     *
     * @return 返回的删除结果，只是包含当前的亲子关系，
     * 不包括循环遍历删除当前节点子孙节点的节点更新情况（实际使用情况目前还没这种情况），此时前端需清除缓存
     * */
    fun removeGroupInRule(id: Int, parentRuleId: Int?):  DelResult? {
        val ruleGroup = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")
        if (ruleGroup == null) {
            log.warn("no child ruleGroup, id=$id when del, parentRuleId=$parentRuleId")
            return null
        }

        var count = 0L

        if(parentRuleId != null){
            val ruleParentIds = removeId(ruleGroup.ruleParentIds, parentRuleId)
            //没有其它parents，亦即不是其它节点的子节点，递归删除自己及自己的子节点
            if(ruleParentIds.isNullOrEmpty() && ruleGroup.ruleGroupParentIds.isNullOrEmpty()){
                //若有孩子，将递归删除孩子及自己
                count += delGroupAndChildrenRecursively(ruleGroup)
            }

            //解除父子关系
            removeRelation_GroupInRule(ruleGroup, parentRuleId, true)
        }else{
            //没有其它parents，亦即不是其它节点的子节点，递归删除自己及自己的子节点
            if(ruleGroup.ruleParentIds.isNullOrEmpty() && ruleGroup.ruleGroupParentIds.isNullOrEmpty()){
                //若有孩子，将递归删除孩子及自己
                count += delGroupAndChildrenRecursively(ruleGroup)
            }
        }


        return DelResult(count, RuleAndGroupdIds(null, null), RuleAndGroupdIds(null, null))
    }

    /**
     * 删除父ruleGroup下的子ruleGroup
     *
     * 若是多亲（有父group，或其它父rule），则只拆除亲子关系
     * 若只是单亲，且单亲是parentId：若有孩子，则递归调用删除孩子，若无孩子则删除自己
     *
     * @param id 子ruleGroup的id
     * @param parentRuleGroupId 父ruleGroup的id 若为空则可能是root级别
     *
     * @return 返回的删除结果，只是包含当前的亲子关系，
     * 不包括循环遍历删除当前节点子孙节点的节点更新情况（实际使用情况目前还没这种情况），此时前端需清除缓存
     * */
    fun removeGroupInGroup(id: Int, parentRuleGroupId: Int?):  DelResult? {
        val ruleGroup = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq id }, "ruleGroup/$id")
        if (ruleGroup == null) {
            log.warn("no child ruleGroup, id=$id when del, parentRuleGroupId=$parentRuleGroupId")
            return null
        }
        var count = 0L

        if(parentRuleGroupId != null){
            val ruleGroupParentIds = removeId(ruleGroup.ruleGroupParentIds, parentRuleGroupId)
            //没有其它parents，亦即不是其它节点的子节点，递归删除自己及自己的子节点
            if(ruleGroup.ruleParentIds.isNullOrEmpty() && ruleGroupParentIds.isNullOrEmpty()){
                //若有孩子，将递归删除孩子及自己
                count += delGroupAndChildrenRecursively(ruleGroup)
            }

            //解除父子关系
            removeRelation_GroupInGroup(ruleGroup, parentRuleGroupId, true)
        }else{
            //没有其它parents，亦即不是其它节点的子节点，递归删除自己及自己的子节点
            if(ruleGroup.ruleParentIds.isNullOrEmpty() && ruleGroup.ruleGroupParentIds.isNullOrEmpty()){
                //若有孩子，将递归删除孩子及自己
                count += delGroupAndChildrenRecursively(ruleGroup)
            }
        }

        return DelResult(count, RuleAndGroupdIds(null, null),RuleAndGroupdIds(null,null))
    }


    /**
     * 删除父ruleGroup下的子rule
     *
     * 若是多亲（有父group，或其它父rule），则只拆除亲子关系
     * 若只是单亲，且单亲是parentId：若有孩子，则递归调用删除孩子，若无孩子则删除自己
     *
     * @param id 子rule的id
     * @param parentRuleGroupId 父ruleGroup的id 若为空则可能是root级别
     *
     * @return 返回的删除结果，只是包含当前的亲子关系，
     * 不包括循环遍历删除当前节点子孙节点的节点更新情况（实际使用情况目前还没这种情况），此时前端需清除缓存
     * */
    fun removeRuleInGroup(id: Int, parentRuleGroupId: Int?): DelResult? {
        val rule = service.findOne(Meta.rule, { Meta.rule.id eq id }, "rule/$id")
        if (rule == null) {
            log.warn("no child rule, id=$id when del, parentRuleGroupId=$parentRuleGroupId")
            return null
        }

        var count = 0L

        if(parentRuleGroupId != null){
            val ruleGroupParentIds = removeId(rule.ruleGroupParentIds, parentRuleGroupId)
            //没有其它parents，亦即不是其它节点的子节点，递归删除自己及自己的子节点
            if(rule.ruleParentIds.isNullOrEmpty() && ruleGroupParentIds.isNullOrEmpty()){
                //若有孩子，将递归删除孩子及自己
                count += delRuleAndChildrenRecursively(rule)
            }

            //解除父子关系
            removeRelation_RuleInGroup(rule, parentRuleGroupId, true)
        }else{
            //没有其它parents，亦即不是其它节点的子节点，递归删除自己及自己的子节点
            if(rule.ruleParentIds.isNullOrEmpty() && rule.ruleGroupParentIds.isNullOrEmpty()){
                //若有孩子，将递归删除孩子及自己
                count += delRuleAndChildrenRecursively(rule)
            }
        }


        return DelResult(count, RuleAndGroupdIds(null, null), RuleAndGroupdIds(null, null))
    }

    private fun delRuleAndChildrenRecursively(rule: Rule): Long{
        var count = 0L
        val groupChildren = rule.ruleGroupChildrenIds?.split(",")
        val ruleChildren = rule.ruleChildrenIds?.split(",")

        val ruleId = rule.id
        count += service.delete(Meta.rule, { Meta.rule.id eq ruleId }, "rule/$ruleId")
        //若有孩子，先递归删除rule的孩子，再删除rule
        groupChildren?.forEach {
            count += removeGroupInRule(it.toInt(), ruleId)?.count?:0 //删除rule下的group孩子：可能删除了孩子，也可能只是拆解父子关系
        }
        ruleChildren?.forEach {
            count += removeRuleInRule(it.toInt(), ruleId)?.count?:0//删除rule下的rule孩子：：可能删除了孩子，也可能只是拆解父子关系
        }

        return count
    }

    private fun delGroupAndChildrenRecursively(ruleGroup: RuleGroup): Long{
        var count = 0L
        val groupChildren = ruleGroup.ruleGroupChildrenIds?.split(",")
        val ruleChildren = ruleGroup.ruleChildrenIds?.split(",")

        val ruleGroupId = ruleGroup.id
        count += service.delete(Meta.ruleGroup, { Meta.ruleGroup.id eq ruleGroupId }, "ruleGroup/$ruleGroupId")
        //若有孩子，先递归删除rule的孩子，再删除rule
        groupChildren?.forEach {
            count += removeGroupInGroup(it.toInt(), ruleGroupId)?.count?:0 //删除rule下的group孩子：可能删除了孩子，也可能只是拆解父子关系
        }
        ruleChildren?.forEach {
            count += removeRuleInGroup(it.toInt(), ruleGroupId)?.count?:0//删除rule下的rule孩子：：可能删除了孩子，也可能只是拆解父子关系
        }

        return count
    }

    /**
     * 将当前rule或ruleGroup移动到新的rule或RuleGroup下
     * 先解除亲子关系，再重新建立新的亲子关系
     * */
    public fun moveRuleCommonIntoNewParent(p: MoveParam): MoveResult? {
        when(p.current.type){
            RuleType.rule -> {
                val rule = service.findOne(Meta.rule, { Meta.rule.id eq p.current.id }, "rule/${p.current.id}")
                if (rule == null) {
                    log.warn("no child rule, id=${p.current.id} when move")
                    return null
                }

                var parentGroupIds = rule.ruleGroupParentIds
                var parentRuleIds = rule.ruleParentIds
                val oldRuleChildrenIds = if(p.oldParent != null){
                    when(p.oldParent.type){
                        RuleType.rule -> {
                            parentRuleIds = removeId(parentRuleIds, p.oldParent.id)
                            removeRelation_RuleInRule(rule, p.oldParent.id, false).second
                        }
                        RuleType.ruleGroup -> {
                            parentGroupIds = removeId(parentGroupIds, p.oldParent.id)
                            removeRelation_RuleInGroup(rule, p.oldParent.id, false).second
                        }
                    }
                }else null

                val newRuleChildrenIds = if(p.newParent != null){
                    when(p.newParent.type){
                        RuleType.rule -> {
                            parentRuleIds = addId(parentRuleIds, p.newParent.id)
                            addChild_RuleInRule(p.current.id, p.newParent.id)
                        }
                        RuleType.ruleGroup -> {
                            parentGroupIds = addId(parentGroupIds, p.newParent.id)
                            addChild_RuleInGroup(p.current.id, p.newParent.id)
                        }
                    }
                }else {//到根节点下
                    parentRuleIds = null
                    parentGroupIds = null
                    null
                }

                // 更新父节点信息
                service.updateValues(
                    Meta.rule,
                    {
                        Meta.rule.ruleParentIds eq parentRuleIds
                        Meta.rule.ruleGroupParentIds eq parentGroupIds
                        Meta.rule.level eq p.newLevel
                    },
                    { Meta.rule.id eq p.current.id },
                    "rule/${p.current.id}"
                )

                return MoveResult(RuleAndGroupdIds(parentRuleIds, parentGroupIds), RuleAndGroupdIds(oldRuleChildrenIds, null), RuleAndGroupdIds(newRuleChildrenIds, null))
            }

            RuleType.ruleGroup -> {
                val ruleGroup = service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq p.current.id }, "ruleGroup/${p.current.id}")
                if (ruleGroup == null) {
                    log.warn("no child ruleGroup, id=${p.current.id} when move")
                    return null
                }

                var parentGroupIds = ruleGroup.ruleGroupParentIds
                var parentRuleIds = ruleGroup.ruleParentIds
                val oldGroupChildrenIds = if(p.oldParent != null){
                    when(p.oldParent.type){
                        RuleType.rule -> {
                            parentRuleIds = removeId(parentRuleIds, p.oldParent.id)
                            removeRelation_GroupInRule(ruleGroup, p.oldParent.id, false).second
                        }
                        RuleType.ruleGroup -> {
                            parentGroupIds = removeId(parentGroupIds, p.oldParent.id)
                            removeRelation_GroupInGroup(ruleGroup, p.oldParent.id, false).second
                        }
                    }
                }else null
                val newGroupChildrenIds = if(p.newParent != null){
                    when(p.newParent.type){
                        RuleType.rule -> {
                            parentRuleIds = addId(parentRuleIds, p.newParent.id)
                            addChild_GroupInRule(p.current.id, p.newParent.id)
                        }
                        RuleType.ruleGroup -> {
                            parentGroupIds = addId(parentGroupIds, p.newParent.id)
                            addChild_GroupInGroup(p.current.id, p.newParent.id)
                        }
                    }
                }else {//到根节点下
                    parentRuleIds = null
                    parentGroupIds = null
                    null
                }

                log.info("update parentRuleIds=${parentRuleIds}, parentGroupIds=${parentGroupIds} of ruleGroup=${p.current.id}")
                // 更新父节点信息
                service.updateValues(
                    Meta.ruleGroup,
                    {
                        Meta.ruleGroup.ruleParentIds eq parentRuleIds
                        Meta.ruleGroup.ruleGroupParentIds eq parentGroupIds
                        Meta.ruleGroup.level eq p.newLevel
                    },
                    { Meta.ruleGroup.id eq p.current.id },
                    "ruleGroup/${p.current.id}"
                )
                return MoveResult(RuleAndGroupdIds(parentRuleIds, parentGroupIds), RuleAndGroupdIds(null, oldGroupChildrenIds), RuleAndGroupdIds(null, newGroupChildrenIds))
            }
        }
    }

    /**
     * 将id添加父节点的children中，返回父节点的新childrenIds
     * @param id 子rule id
     * @param parentRuleId 父rule id
     * */
    private fun addChild_RuleInRule(id: Int, parentRuleId: Int): String?{
        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentRuleId }, "rule/$parentRuleId")
        return if (parent == null) {
            log.warn("no parentRule,Id=$parentRuleId when addRelation_RuleInRule")
            null
        } else {
            //更新父Rule的子rule节点：从父rule的ruleChildrenIds中移出id并更新父rule
            val ruleChildrenIds = addId(parent.ruleChildrenIds, id)
            if (ruleChildrenIds != parent.ruleChildrenIds) {
                val count = service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.rule.id eq parentRuleId },
                    "rule/$parentRuleId"
                )
                if (count > 0L ) ruleChildrenIds else null
            }else null
        }
    }

    /**
     * 去除父节点中的chidlren信息，子节点中的parent信息更新由updateChild决定
     * @param rule 子节点
     * @param parentId 父节点id
     * @param updateChild 是否更新子节点的 parentIds信息
     * @return 返回字符串对：子节点中更新后的parentIds 父节点中更新后的childrenIds
     * */
    private fun removeRelation_RuleInRule(rule: Rule, parentId: Int, updateChild: Boolean = true): Pair<String?, String?>{
        val id = rule.id!!
        var pId: String? = null
        var childId: String? = null
        if(updateChild){
            val ruleParentIds = removeId(rule.ruleParentIds, parentId)
            if (ruleParentIds != rule.ruleParentIds) {
                if(service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleParentIds eq ruleParentIds },
                    { Meta.rule.id eq id },
                    "rule/$id"
                ) > 0L) pId = ruleParentIds
            }
        }

        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentId }, "rule/$parentId")
        if (parent == null) {
            log.warn("no old parentRuleId=$parentId when changeRelation_RuleInRule")
        } else {
            //更新父Rule的子rule节点：从父rule的ruleChildrenIds中移出id并更新父rule
            val ruleChildrenIds = removeId(parent.ruleChildrenIds, id)
            if (ruleChildrenIds != parent.ruleChildrenIds) {
                val count = service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.rule.id eq parentId },
                    "rule/$parentId"
                )
                if (count > 0L ) childId = ruleChildrenIds
            }
        }
        return Pair(pId, childId)
    }

    /**
     * 将id添加父节点的children中，返回父节点的新childrenIds
     * @param id 子rule id
     * @param parentRuleGroupId 父ruleGroup id
     * */
    private fun addChild_RuleInGroup(id: Int, parentRuleGroupId: Int): String?{
        val parent =
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq parentRuleGroupId }, "ruleGroup/$parentRuleGroupId")
        return if (parent == null) {
            log.warn("no parentRuleGroup, parentRuleGroupId=$parentRuleGroupId when addRelation_RuleInGroup")
            null
        } else {
            //更新父RuleGroup的子rule节点：在父ruleGroup的ruleChildrenIds中添加id并更新父ruleGroup
            val ruleChildrenIds = addId(parent.ruleChildrenIds, id)
            if (ruleChildrenIds != parent.ruleChildrenIds) {
                val count = service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.ruleGroup.id eq parentRuleGroupId },
                    "ruleGroup/$parentRuleGroupId"
                )
                if (count > 0L ) ruleChildrenIds else null
            }else null
        }
    }
    /**
     * 去除父节点中的chidlren信息，子节点中的parent信息更新由updateChild决定
     * @param rule 子节点
     * @param parentId 父节点id
     * @param updateChild 是否更新子节点的 parentIds信息
     * @return 返回字符串对：子节点中更新后的parentIds 父节点中更新后的childrenIds
     * */
    private fun removeRelation_RuleInGroup(rule: Rule, parentId: Int, updateChild: Boolean = true): Pair<String?, String?>{
        val id = rule.id!!
        var pId: String? = null
        var childId: String? = null
        if(updateChild){
            val ruleGroupParentIds = removeId(rule.ruleGroupParentIds, parentId)
            if (ruleGroupParentIds != rule.ruleGroupParentIds) {
                if(service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleGroupParentIds eq ruleGroupParentIds },
                    { Meta.rule.id eq id },
                    "rule/$id"
                ) > 0L) pId = ruleGroupParentIds
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
                val count = service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleChildrenIds eq ruleChildrenIds },
                    { Meta.ruleGroup.id eq parentId },
                    "ruleGroup/$parentId"
                )
                if (count > 0L ) childId = ruleChildrenIds
            }
        }

        return Pair(pId, childId)
    }

    /**
     * 将id添加父节点的children中，返回父节点的新childrenIds
     * @param id 子group id
     * @param parentRuleId 父rule id
     * */
    private fun addChild_GroupInRule(id: Int, parentRuleId: Int): String?{
        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentRuleId }, "rule/$parentRuleId")
        return if (parent == null) {
            log.warn("no parentRule, parentRuleId=$parentRuleId when del")
            null
        } else {
            //更新父Rule的子ruleGroup节点：在父rule的ruleGroupChildrenIds中添加id并更新父rule
            val ruleGroupChildrenIds = addId(parent.ruleGroupChildrenIds, id)
            if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                val count = service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.rule.id eq parentRuleId },
                    "rule/$parentRuleId"
                )
                if (count > 0L ) ruleGroupChildrenIds else null
            }else null
        }
    }


    /**
     * 去除父节点中的chidlren信息，子节点中的parent信息更新由updateChild决定
     * @param ruleGroup 子节点
     * @param parentId 父节点id
     * @param updateChild 是否更新子节点的 parentIds信息
     * @return 返回字符串对：子节点中更新后的parentIds 父节点中更新后的childrenIds
     * */
    private fun removeRelation_GroupInRule(ruleGroup: RuleGroup, parentId: Int, updateChild: Boolean = true): Pair<String?, String?>{
        val id = ruleGroup.id!!
        var pId: String? = null
        var childId: String? = null
        if(updateChild){
            val ruleParentIds = removeId(ruleGroup.ruleParentIds, parentId)
            if (ruleParentIds != ruleGroup.ruleParentIds) {
                if(service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleParentIds eq ruleParentIds },
                    { Meta.ruleGroup.id eq id },
                    "ruleGroup/$id"
                ) > 0L) pId = ruleParentIds
            }
        }

        val parent = service.findOne(Meta.rule, { Meta.rule.id eq parentId }, "rule/$parentId")
        if (parent == null) {
            log.warn("no parentRule, parentRuleId=$parentId when removeRelation")
        } else {
            //更新父Rule的子group节点：从父rule的ruleGroupChildrenIds中移出id并更新父rule
            val ruleGroupChildrenIds = removeId(parent.ruleGroupChildrenIds, id)
            if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
               val count = service.updateValues(
                    Meta.rule,
                    { Meta.rule.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.rule.id eq parentId },
                    "rule/$parentId"
                )
                if (count > 0L ) childId = ruleGroupChildrenIds
            }
        }
        return Pair(pId, childId)
    }

    /**
     * 将id添加父节点的children中，返回父节点的新childrenIds
     * @param id 子group id
     * @param parentRuleId 父ruleGroup id
     * */
    private fun addChild_GroupInGroup(id: Int, parentRuleGroupId: Int): String?{
        val parent =
            service.findOne(Meta.ruleGroup, { Meta.ruleGroup.id eq parentRuleGroupId }, "ruleGroup/$parentRuleGroupId")
        return if (parent == null) {
            log.warn("no parentRuleGroup, parentRuleGroupId=$parentRuleGroupId when addRelation_GroupInGroup")
            null
        } else {
            //更新父RuleGroup的子ruleGroup节点：在父rule的ruleGroupChildrenIds中添加id并更新父rule
            val ruleGroupChildrenIds = addId(parent.ruleGroupChildrenIds, id)
            if (ruleGroupChildrenIds != parent.ruleGroupChildrenIds) {
                val count = service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.ruleGroup.id eq parentRuleGroupId },
                    "ruleGroup/$parentRuleGroupId"
                )
                if (count > 0L ) ruleGroupChildrenIds else null
            }else null
        }
    }

    /**
     * 去除父节点中的chidlren信息，子节点中的parent信息更新由updateChild决定
     * @param ruleGroup 子节点
     * @param parentId 父节点id
     * @param updateChild 是否更新子节点的 parentIds信息
     * @return 返回字符串对：子节点中更新后的parentIds 父节点中更新后的childrenIds
     * */
    private fun removeRelation_GroupInGroup(ruleGroup: RuleGroup, parentId: Int, updateChild: Boolean = true): Pair<String?, String?> {
        //更新子ruleGroup的父group节点: 从rule的ruleParentIds中移出parentRuleId并更新ruleGroup
        val id = ruleGroup.id!!
        var pId: String? = null
        var childId: String? = null
        if(updateChild){
            val ruleGroupParentIds = removeId(ruleGroup.ruleGroupParentIds, parentId)
            if (ruleGroupParentIds != ruleGroup.ruleGroupParentIds) {
                val count = service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleGroupParentIds eq ruleGroupParentIds },
                    { Meta.ruleGroup.id eq id },
                    "ruleGroup/$id"
                )
                if(count > 0L) pId = ruleGroupParentIds
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
                val count = service.updateValues(
                    Meta.ruleGroup,
                    { Meta.ruleGroup.ruleGroupChildrenIds eq ruleGroupChildrenIds },
                    { Meta.ruleGroup.id eq parentId },
                    "ruleGroup/$parentId"
                )
                if (count > 0L ) childId = ruleGroupChildrenIds
            }
        }
        return Pair(pId, childId)
    }
}