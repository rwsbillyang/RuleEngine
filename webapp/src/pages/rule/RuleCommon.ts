import { UseCacheConfig, TreeCache, cachedFetchPromise } from "@rwsbillyang/usecache"
import { Rule, RuleCommon, RuleGroup } from "../DataType"
import { RuleName, rubleTableProps } from "./RuleTable"
import { dispatch } from "use-bus"
import { UpdateTreeNodeParams, deleteOne, saveOne } from "easy-antd-pro"
import { RuleGroupName, rubleGroupTableProps } from "./RuleGroupTable"

import { message } from "antd"
import { MoveNodeParamWithParent } from "./MoveRuleNode"
import { EnableRefreshListAfterUpdate } from "@/Config"


export const SaveSubInRuleAPI = "/api/rule/composer/saveSubInRule/" //   {name}/{parentRuleId}"
export const SaveSubInRuleGroupAPI = "/api/rule/composer/saveSubInRuleGroup/" //   {name}/{parentRuleId}"


export interface InsertNodeResult{
    ruleCommon: RuleCommon //插入的节点
    parent: RuleAndGroupdIds//parent变更后的两种childrenIds
}

/**
 * 
 * @param fromTable 
 * @param isAdd 
 * @param debug 
 * @param currentRow 新增时为新增currentRow的子节点，编辑时为编辑当前行
 * @returns 
 */
export function getOnInsertNodeOk(fromTable: string, isAdd: boolean, debug: boolean, currentRow: RuleCommon) {
    const onSaveOK = (data: InsertNodeResult) => {//后端返回的是RuleCommon
        //构建相互指向的父子关系，后端处理保存亲子关系

        //idKey 已在table中配置成了 idKey: "typedId",
        let cacheKey, idKey, listApi, log
        if (fromTable === RuleName) {
            cacheKey = rubleTableProps.cacheKey
            idKey = rubleTableProps.idKey || UseCacheConfig.defaultIdentiyKey || "id"
            listApi = rubleTableProps.listApi
            if (debug) log = "to refresh rule table cache after insert node..."
        } else if (fromTable === RuleGroupName) {
            cacheKey = rubleGroupTableProps.cacheKey
            idKey = rubleGroupTableProps.idKey || UseCacheConfig.defaultIdentiyKey || "id"
            listApi = rubleGroupTableProps.listApi
            if (debug) log = "to refresh ruleGroup table cache after insert node..."
        }

        if (debug) console.log(log)
        //树形遍历，找到树形的根，然后保存到缓存
        
        if (isAdd) {
            const updateRelation = (parent, e, _) => {
                e.posPath = [...(parent.posPath), data.ruleCommon[idKey]]//更更新子节点的posPath
                //更新父节点的childrenIds
                if (data.parent.ruleIds) {
                    if (parent.rule) parent.rule.ruleChildrenIds = data.parent.ruleIds
                    if (parent.ruleGroup) parent.ruleGroup.ruleChildrenIds = data.parent.ruleIds
                }
                if (data.parent.groupIds) {
                    if (parent.rule) parent.rule.ruleGroupChildrenIds = data.parent.groupIds
                    if (parent.ruleGroup) parent.ruleGroup.ruleGroupChildrenIds = data.parent.groupIds
                }
            }
            if (cacheKey) {
                //新增时，新增的节点后端为自己的typeId，需前端构建
                const flag = TreeCache.onAddOneInTree(cacheKey, data.ruleCommon, currentRow.posPath,
                    //更新父节点的childrenIds，更新子节点的posPath，子节点的parentsIds后端返回它时已经更新过
                    updateRelation , idKey)

                if (flag) dispatch("cacheUpdate-" + listApi) //已更新
            } else {
                const p: UpdateTreeNodeParams = {
                    e: data.ruleCommon, posPath: currentRow.posPath, idKey: idKey, updateRelation, childrenFieldName: "children", debug: true
                }
                dispatch({ type: "refreshList-addTree-" + listApi, payload: p })
            }
        }
    }

    return onSaveOK
}

function getOnUpdateNodeOk(fromTable: string, isAdd: boolean, debug: boolean, currentRow: RuleCommon) {
    const onSaveOK = (data: RuleCommon) => {//后端返回的是RuleCommon
        //构建相互指向的父子关系，后端处理保存亲子关系

        //idKey 已在table中配置成了 idKey: "typedId",
        let cacheKey, idKey, listApi, log
        if (fromTable === RuleName) {
            cacheKey = rubleTableProps.cacheKey
            idKey = rubleTableProps.idKey || UseCacheConfig.defaultIdentiyKey || "id"
            listApi = rubleTableProps.listApi
            if (debug) log = "to refresh rule table cache after update..."
        } else if (fromTable === RuleGroupName) {
            cacheKey = rubleGroupTableProps.cacheKey
            idKey = rubleGroupTableProps.idKey || UseCacheConfig.defaultIdentiyKey || "id"
            listApi = rubleGroupTableProps.listApi
            if (debug) log = "to refresh ruleGroup table cache after update..."
        }

        //树形遍历，找到树形的根，然后保存到缓存
        if (debug) console.log(log)
        if (EnableRefreshListAfterUpdate && currentRow.posPath) {
            //编辑时，节点后端返回从自身开始的parentPath，应该从根节点开始，后更改为自己的typeId，前端恢复原值
            data.posPath = currentRow.posPath
            data.children = currentRow.children
            if (cacheKey) {
                const flag = TreeCache.onEditOneInTreeCache(cacheKey, data, currentRow.posPath, idKey)
                if (flag) dispatch("cacheUpdate-" + listApi) //已更新
            } else {
                const p: UpdateTreeNodeParams = {
                    e: data, posPath: currentRow.posPath, idKey: idKey, updateRelation: () => true, childrenFieldName: "children", debug: false
                }
                dispatch({ type: "refreshList-editTree-" + listApi, payload: p }) 
            }

        } else console.warn("no path when edit/update")
        
    }

    return onSaveOK
}

/**
 * 无关亲子关系的保存及更新
 * @param rule 
 * @param old 
 * @param isAdd 
 * @returns 
 */
function saveRule(rule: Rule, old: Partial<Rule>, isAdd: boolean, 
    onSaveOK?: (data: RuleCommon) => void): boolean{
    return saveOne<Rule, RuleCommon>(rule, old, rubleTableProps.saveApi,
        rubleTableProps.transformBeforeSave, onSaveOK, isAdd,
        rubleTableProps.listApi, rubleTableProps.cacheKey, rubleTableProps.idKey)
}
/**
 * 无关亲子关系的保存及更新
 * @param group 
 * @param old 
 * @param isAdd 
 */
function saveRuleGroup(group: RuleGroup, old: Partial<RuleGroup>, isAdd: boolean, onSaveOK?: (data: RuleCommon) => void): boolean{
    return saveOne<RuleGroup, RuleCommon>(group, old, rubleGroupTableProps.saveApi,
        rubleGroupTableProps.transformBeforeSave, onSaveOK, isAdd,
        rubleGroupTableProps.listApi, rubleGroupTableProps.cacheKey, rubleGroupTableProps.idKey)
}



/**
 * 
 * @param fromTable 从哪个表格中进行的新增或编辑操作，涉及到使用MyProTableProps中的缓存
 * @param name 要保存的是rule还是ruleGroup
 * @param values 要保存的值
 * @param isAdd 是否新增
 * @param record 原始旧记录
 * @param rowRuleCommon 在哪个Rule上新增子项或编辑，若是新增顶级节点新增则为空，新增子节点或编辑时均不能为空
 * @param debug 日志输出开关
 */
export function saveRuleOrGroup(
    fromTable: string,
    name: string,
    values: Rule | RuleGroup,
    isAdd: boolean,
    record?: Partial<Rule> | Partial<RuleGroup>,
    rowRuleCommon?: RuleCommon,
    debug: boolean = true) {

    if (isAdd) {//add one
        //新增顶级root
        if (!rowRuleCommon) {
            if (fromTable === RuleName) {//新增顶级rule
                if (debug) console.log("to save top rule in rule table...")
                //bugfix：parentIdPath后端返回自己的[typeId]，避免了空
                saveRule(values as Rule, record as Partial<Rule>, isAdd)
            } else if (fromTable === RuleGroupName) {//新增顶级ruleGroup
                if (debug) console.log("to save top ruleGroup in ruleGroup table...")
                //bugfix：posPath后端返回自己的[typeId]，避免了空
                saveRuleGroup(values as RuleGroup, record as Partial<RuleGroup>, isAdd)
            } else {
                console.warn("not support fromTable=" + fromTable)
            }
        } else {// 新增子条目
            const onSaveOK = getOnInsertNodeOk(fromTable, isAdd, debug, rowRuleCommon)

            if (rowRuleCommon?.rule) {//在rule下新增
                if (name === RuleName) {//新增rule
                    if (debug) console.log("to save sub rule in parent rule...")
                    saveOne(values as Rule, record,
                        SaveSubInRuleAPI + name + "/" + rowRuleCommon.id,
                        rubleTableProps.transformBeforeSave,
                        onSaveOK)
                } else if (name === RuleGroupName) {//新增ruleGroup
                    if (debug) console.log("to save sub ruleGroup in parent rule...")
                    saveOne(values as RuleGroup, record,
                        SaveSubInRuleAPI + name + "/" + rowRuleCommon.id,
                        rubleGroupTableProps.transformBeforeSave,
                        onSaveOK)
                } else
                    console.warn("not support name=" + name)
            } else if (rowRuleCommon?.ruleGroup) {//在ruleGroup下新增
                if (name === RuleName) {//新增rule
                    if (debug) console.log("to save sub rule in parent ruleGroup...")
                    saveOne(values as Rule, record,
                        SaveSubInRuleGroupAPI + name + "/" + rowRuleCommon.id,
                        rubleTableProps.transformBeforeSave,
                        onSaveOK)
                } else if (name === RuleGroupName) {//新增ruleGrou
                    if (debug) console.log("to save sub ruleGroup in parent ruleGroup...")
                    saveOne(values as RuleGroup, record,
                        SaveSubInRuleGroupAPI + name + "/" + rowRuleCommon.id,
                        rubleGroupTableProps.transformBeforeSave,
                        onSaveOK)
                } else
                    console.warn("not support name=" + name)
            }
        }
    } else {//update one
        if (rowRuleCommon) {
            const onUpdateOK = getOnUpdateNodeOk(fromTable, isAdd, debug, rowRuleCommon)
            //不区分是根节点，由onSaveOK进行区分去更新cache
            if (fromTable === RuleName) {//编辑rule
                if (name === RuleName) {
                    if (debug) console.log("to update rule in rule table...")
                    saveRule(values as Rule, record as Partial<Rule>, false, onUpdateOK)
                } else if (name === RuleGroupName) {
                    if (debug) console.log("to update ruleGroup in rule table...")
                    saveRuleGroup(values as RuleGroup, record as Partial<RuleGroup>, false, onUpdateOK)
                }
            } else if (fromTable === RuleGroupName) {
                if (name === RuleName) {
                    if (debug) console.log("to update rule in ruleGroup table...")
                    saveRule(values as Rule, record as Partial<Rule>, false, onUpdateOK)
                }
                else if (name === RuleGroupName) {
                    if (debug) console.log("to update ruleGroup in ruleGroup table...")
                    saveRuleGroup(values as RuleGroup, record as Partial<RuleGroup>, false, onUpdateOK)
                } else {
                    console.warn("not support fromTable=" + fromTable)
                }
            }
        } else {
            console.warn("not provdide row rule common when edit, fromTable=" + fromTable)
        }
        
    }
}



interface DelResult{
    count: number, //总共删除的数量
    e?: RuleAndGroupdIds,//当前节点变更后的两种parentIds
    parent?: RuleAndGroupdIds,//parent变更后的两种childrenIds
}
   
/**
 * 删除时，需要知道待删除行的RuleCommon、父行（若为空，则待删除行为树的根），删除完需刷新列表（需知道是哪个列表、根到自身的路径）
 * @param fromTable 来自哪个table中的删除操作：若是rule，则是在ruleTable表中删除，删除成功后则更新ruleTableProps中参数指定的缓存；若是ruleGroup，则类似
 * @param item 删除对象：  RuleCommon
 */
export function deleteRuleOrGroup(
    fromTable: string,
    item: RuleCommon,
    debug: boolean = true) {

    let tableProps
    if (fromTable === RuleName) {
        tableProps = rubleTableProps
    } else if (fromTable === RuleGroupName) {
        tableProps = rubleGroupTableProps
    } else {
        console.warn("Should not come here1")
        return
    }

    let parentRuleCommon: RuleCommon | undefined
    let parentGroupCommon: RuleCommon | undefined
    let parent: RuleCommon | undefined
    let elemPath: RuleCommon[] | undefined
    const path = item.posPath
    console.log("to delete item: ", path)
    if (path.length > 1) {
        elemPath = TreeCache.getElementsByPathIdsInTreeFromCache(tableProps.cacheKey, path, tableProps.idKey)//树形数据转换成数组
        if (elemPath) {
            const p = elemPath[elemPath.length - 2]
            parent = p
            if (p.rule) parentRuleCommon = parent
            else if (p.ruleGroup) parentGroupCommon = parent
            else console.warn("Should not come here2")
        }
    }


    //刷新缓存
    const onDelOK = (result: DelResult) => {
        message.success(result.count + "条被删除")
        const updateRelation = (parent, e, _) => {
            //若节点可以有多个父节点， 则需清除缓存，DelResult不足以反应网状结构联动删除的亲子关系情况
            if(result.e){//当前子节点的parentId有更新
                if(result.e.ruleIds){//父ruleIds需更新
                    if(e.rule) e.rule.ruleParentIds = result.e.ruleIds //当前子节点是rule
                    if(e.ruleGroup) e.ruleGroup.ruleParentIds = result.e.ruleIds//当前子节点是ruleGroup
                }
                if(result.e.groupIds){//父ruleGroupIds需更新
                    if(e.rule) e.rule.ruleGroupParentIds = result.e.groupIds//当前子节点是rule
                    if(e.ruleGroup) e.ruleGroup.ruleGroupParentIds = result.e.groupIds//当前子节点是ruleGroup
                }
            }
            if(result.parent){//父节点的childrenIds有更新
                if(result.parent.ruleIds){//父节点的子ruleIds需更新
                    if(parent.rule) parent.rule.ruleChildrenIds = result.parent.ruleIds //当前子节点是rule
                    if(parent.ruleGroup) parent.ruleGroup.ruleChildrenIds = result.parent.ruleIds//当前子节点是ruleGroup
                }
                if(result.parent.groupIds){//父节点的子ruleGroupIds需更新
                    if(parent.rule) parent.rule.ruleGroupChildrenIds = result.parent.groupIds//当前子节点是rule
                    if(parent.ruleGroup) parent.ruleGroup.ruleGroupChildrenIds = result.parent.groupIds//当前子节点是ruleGroup
                }
            }
        }

        if(tableProps.cacheKey){
            if (TreeCache.onDelOneInTreeCache(tableProps.cacheKey, item, item.posPath,updateRelation, tableProps.idKey) )
            {
                dispatch("cacheUpdate-" + tableProps.listApi) //删除完毕，发送refreshList，告知ListView去更新
            }
        }else{
            const p: UpdateTreeNodeParams = {
                e: item, posPath: item.posPath, idKey: tableProps.idKey, updateRelation, childrenFieldName: "children", debug: false
            }
            dispatch({ type: "refreshList-editTree-" + tableProps.listApi, payload: p }) 
        }
        
        
    }
    const delPrefix = "/api/rule/composer"

    if (item.rule) {//删除的是rule
        //待删项是叶子节点 删除叶子节点也需要变更父节点中的children信息
        // if (!item.children || item.children.length === 0) {
        //     if (fromTable === RuleName) {
        //         if (debug) console.log("to delete leaf rule in rule table...")
        //         deleteOne<DelResult>(item, rubleTableProps.delApi + "/" + item.id, onDelOK)
        //     } else if (fromTable === RuleGroupName) {//新增顶级ruleGroup
        //         if (debug) console.log("to delete leaf rule in ruleGroup table...")
        //         deleteOne(item, rubleTableProps.delApi + "/" + item.id, onDelOK)
        //     }
        // } else {//待删项不是叶子节点
            if (fromTable === RuleName) {
                if (parentRuleCommon) {
                    if (debug) console.log("to delete sub rule of parentRule in rule table...")
                    deleteOne(item, `${delPrefix}/delSubInParentRule/${RuleName}/${item.id}/${parentRuleCommon.id}`, onDelOK)
                } else if (parentGroupCommon) {
                    if (debug) console.log("to delete sub rule of parentGroup in rule table...")
                    deleteOne(item, `${delPrefix}/delSubInParentGroup/${RuleName}/${item.id}/${parentGroupCommon.id}`, onDelOK)
                } else {//item is root
                    if (debug) console.log("to delete root rule in rule table...")
                    deleteOne(item, `${delPrefix}/delSubInParentRule/${RuleName}/${item.id}`, onDelOK)
                }
            } else if (fromTable === RuleGroupName) {
                if (parentRuleCommon) {
                    if (debug) console.log("to delete sub rule of parentRule in ruleGroup table...")
                    deleteOne(item, `${delPrefix}/delSubInParentRule/${RuleName}/${item.id}/${parentRuleCommon.id}`, onDelOK)
                } else if (parentGroupCommon) {
                    if (debug) console.log("to delete sub rule of parentGroup in ruleGroup table...")
                    deleteOne(item, `${delPrefix}/delSubInParentGroup/${RuleName}/${item.id}/${parentGroupCommon.id}`, onDelOK)
                } else {//item is root
                    console.warn("Error: should not come here: to delete root rule in ruleGroup table...")
                }
            } else {
                console.warn("Error: should not come here:  not support from table=" + fromTable)
            }
       // }
    } else if (item.ruleGroup)//删除的是ruleGroup
    {
        //待删项是叶子节点 删除叶子节点也需要变更父节点中的children信息
        // if (!item.children || item.children.length === 0) {
        //     if (fromTable === RuleName) {
        //         if (debug) console.log("to delete leaf ruleGroup in rule table...")
        //         deleteOne(item, rubleGroupTableProps.delApi + "/" + item.id, onDelOK)
        //     } else if (fromTable === RuleGroupName) {//新增顶级ruleGroup
        //         if (debug) console.log("to delete leaf ruleGroup in ruleGroup table...")
        //         deleteOne(item, rubleGroupTableProps.delApi + "/" + item.id, onDelOK)
        //     }
        // } else {//待删项不是叶子节点
            if (fromTable === RuleName) {
                if (parentRuleCommon) {
                    if (debug) console.log("to delete sub ruleGroup of parentRule in rule table...")
                    deleteOne(item, `${delPrefix}/delSubInParentRule/${RuleGroupName}/${item.id}/${parentRuleCommon.id}`, onDelOK)
                } else if (parentGroupCommon) {
                    if (debug) console.log("to delete sub ruleGroup of parentGroup in rule table...")
                    deleteOne(item, `${delPrefix}/delSubInParentGroup/${RuleGroupName}/${item.id}/${parentGroupCommon.id}`, onDelOK)
                } else {//item is root
                    console.warn("Error: should not come here: to delete root ruleGroup in rule table")
                }
            } else if (fromTable === RuleGroupName) {
                if (parentRuleCommon) {
                    if (debug) console.log("to delete sub ruleGroup of parentRule in ruleGroup table...")
                    deleteOne(item, `${delPrefix}/delSubInParentRule/${RuleGroupName}/${item.id}/${parentRuleCommon.id}`, onDelOK)
                } else if (parentGroupCommon) {
                    if (debug) console.log("to delete sub ruleGroup of parentGroup in ruleGroup table...")
                    deleteOne(item, `${delPrefix}/delSubInParentGroup/${RuleGroupName}/${item.id}/${parentGroupCommon.id}`, onDelOK)
                } else {//item is root
                    if (debug) console.log("to delete root ruleGroup in ruleGroup table...")
                    deleteOne(item, `${delPrefix}/delSubInParentGroup/${RuleGroupName}/${item.id}`, onDelOK)
                }
            } else {
                console.warn("Error: should not come here:  not support from table=" + fromTable)
            }
       // }
    } else {
        console.warn("should not come here1")
    }
}




interface RuleIdType {
    id: number,
    type: string //RuleName, RuleGroupName
}

interface MoveParamPostData {
    current: RuleIdType, //当前节点
    oldParent?: RuleIdType, //空表示current为顶级节点
    newParent?: RuleIdType //空表示移动到新顶级节点
    newLevel: number
}

interface RuleAndGroupdIds{
    ruleIds?: string 
    groupIds?: string
}

interface MoveResult{
    e: RuleAndGroupdIds, //当前节点变更后的两种parentIds
    oldParent?: RuleAndGroupdIds,//old parent变更后的两种childrenIds
    newParent?: RuleAndGroupdIds//new parent变更后的两种childrenIds
}
    
/**
 * 
 * @param moveParam 
 * @param newParent 移动到新的父节点，若为空，则表示移动到根节点
 */
export function moveInNewParent(moveParam: MoveNodeParamWithParent) {
    const id = moveParam.currentRow.id
    const type = moveParam.currentRow.rule ? RuleName : (moveParam.currentRow.ruleGroup ? RuleGroupName : undefined)
    if (!id || !type) {
        console.warn("no id or rule or group in currentRow=", moveParam.currentRow)
        return new Promise((resolve) => { resolve(false) });
    }
    const postData: MoveParamPostData = {
        current: { id: id, type: type }, newLevel: 0
    }

    const oldParent = moveParam.oldParent
    if (oldParent) {
        const t = oldParent.rule ? RuleName : (oldParent.ruleGroup ? RuleGroupName : moveParam.fromTable)
        postData.oldParent = { id: oldParent.id, type: t }
    }

    const newParent = moveParam.newParent
    if (newParent) {
        const t = newParent.rule ? RuleName : (newParent.ruleGroup ? RuleGroupName : moveParam.fromTable)
        postData.newParent = { id: newParent.id, type: t }
        postData.newLevel =  (newParent.level || 0) + 1
    }
    

    return cachedFetchPromise<MoveResult>(`/api/rule/composer/move`, 'POST', postData)
        .then((data) => {
            if (data) {
                message.warning("移动节点成功")
                console.log("successful to move, update cache")
                const tableProps = moveParam.tableProps
                const cacheKey = tableProps.cacheKey

                const update1 = (parent, e, parents) => {
                    //更新父节点的childrenIds
                    if(data.oldParent){
                        if(data.oldParent.ruleIds){
                            if(parent.rule) parent.rule.ruleChildrenIds = data.oldParent.ruleIds
                            if(parent.ruleGroup) parent.ruleGroup.ruleChildrenIds = data.oldParent.ruleIds
                        }
                        if(data.oldParent.groupIds){
                            if(parent.rule) parent.rule.ruleGroupChildrenIds = data.oldParent.groupIds
                            if(parent.ruleGroup) parent.ruleGroup.ruleGroupChildrenIds = data.oldParent.groupIds
                        }
                    }
                }

                const update2 = (parent,e, parents) => {
                    //更新自己的path
                    e.posPath = [...(parent.posPath), moveParam.currentRow[tableProps.idKey]]
                    e.level = postData.newLevel
            
                    //更新自己的parentIds
                    if(data.e.ruleIds){
                        if(e.rule)e.rule.ruleParentIds = data.e.ruleIds
                        if(e.ruleGroup) e.ruleGroup.ruleParentIds = data.e.ruleIds
                    }
                    if(data.e.groupIds){
                        if(e.rule)e.rule.ruleGroupParentIds = data.e.groupIds
                        if(e.ruleGroup) e.ruleGroup.ruleGroupParentIds = data.e.groupIds
                    }
                    //更新父节点的childrenIds
                    if(data.newParent){
                        if(data.newParent.ruleIds){
                            if(parent.rule) parent.rule.ruleChildrenIds = data.newParent.ruleIds
                            if(parent.ruleGroup) parent.ruleGroup.ruleChildrenIds = data.newParent.ruleIds
                        }
                        if(data.newParent.groupIds){
                            if(parent.rule) parent.rule.ruleGroupChildrenIds = data.newParent.groupIds
                            if(parent.ruleGroup) parent.ruleGroup.ruleGroupChildrenIds = data.newParent.groupIds
                        }
                    } 
                }

                if(cacheKey){
                    //解除与old parent的亲子关系，双方均需修改
                    const flag1 = TreeCache.onDelOneInTreeCache(cacheKey, moveParam.currentRow,
                        moveParam.currentRow.posPath,
                        update1, tableProps.idKey)

                    //建立与新parent的亲子关系，双方均需修改
                    const flag2 = TreeCache.onAddOneInTree(cacheKey, moveParam.currentRow,
                    moveParam.newParent?.posPath ||[],
                        //因为当前节点变了，需要更新它，以新父节点以及自己的id，构成自己的新path
                        update2, tableProps.idKey)

                    if (flag1 || flag2) {
                     dispatch("cacheUpdate-" + tableProps.listApi) //发送refreshList，告知ListView去更新
                    } else {
                        console.warn("fail to onDelOneInTree and onAddOneInTree")
                    }
                }else{
                    const p1: UpdateTreeNodeParams = {
                        e: moveParam.currentRow, posPath: moveParam.currentRow.posPath, idKey: tableProps.idKey, updateRelation: update1, childrenFieldName: "children", debug: false
                    }
                    dispatch({ type: "refreshList-delTree-" + tableProps.listApi, payload: p1 }) 

                    const p2: UpdateTreeNodeParams = {
                        e: moveParam.currentRow, posPath: moveParam.newParent?.posPath ||[], idKey: tableProps.idKey, updateRelation: update2, childrenFieldName: "children", debug: false
                    }
                    dispatch({ type: "refreshList-addTree-" + tableProps.listApi, payload: p2 }) 
                }
            } else {
                console.log("fail to move")
                message.warning("移动节点失败")
            }
            return new Promise((resolve) => { resolve(true) });
        }).catch((err: Error) => {
            console.warn("moveInNewParent exception: " + err.message)
            message.error(err.message)
        })
}




