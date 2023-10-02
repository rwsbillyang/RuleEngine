import { UseCacheConfig, TreeCache, cachedFetchPromise } from "@rwsbillyang/usecache"
import { Rule, RuleCommon, RuleGroup } from "../DataType"
import { RuleName, rubleTableProps } from "./RuleTable"
import { dispatch } from "use-bus"
import { deleteOne, saveOne } from "@/myPro/MyProTable"
import { RuleGroupName, rubleGroupTableProps } from "./RuleGroupTable"

import { message } from "antd"
import { MoveNodeParamWithParent } from "./MoveRuleNode"


export const SaveSubInRuleAPI = "/api/rule/composer/saveSubInRule/" //   {name}/{parentRuleId}"
export const SaveSubInRuleGroupAPI = "/api/rule/composer/saveSubInRuleGroup/" //   {name}/{parentRuleId}"


/**
 * 
 * @param fromTable 
 * @param isAdd 
 * @param debug 
 * @param currentRow 新增时为新增currentRow的子节点，编辑时为编辑当前行
 * @returns 
 */
function getOnSaveOk(fromTable: string, isAdd: boolean, debug: boolean, currentRow: RuleCommon) {
    const onSaveOK = (data: RuleCommon) => {//后端返回的是RuleCommon
        //构建相互指向的父子关系，后端处理保存亲子关系

        //idKey 已在table中配置成了 idKey: "typedId",
        let cacheKey, idKey, listApi, log
        if (fromTable === RuleName) {
            cacheKey = rubleTableProps.cacheKey
            idKey = rubleTableProps.idKey || UseCacheConfig.defaultIdentiyKey || "id"
            listApi = rubleTableProps.listApi
            if (debug) log = "to refresh rule table cache..."
        } else if (fromTable === RuleGroupName) {
            cacheKey = rubleGroupTableProps.cacheKey
            idKey = rubleGroupTableProps.idKey || UseCacheConfig.defaultIdentiyKey || "id"
            listApi = rubleGroupTableProps.listApi
            if (debug) log = "to refresh ruleGroup table cache..."
        }

        //树形遍历，找到树形的根，然后保存到缓存
        if (cacheKey) {
            if (debug) console.log(log)
            let flag
            if (isAdd) {
                //新增时，新增的节点后端为自己的typeId，需前端构建
                flag = TreeCache.onAddOneInTree(cacheKey, data, currentRow.parentPath, idKey, 
                    (parents, parent) => { data.parentPath = [...(parent.parentPath), data[idKey]] })
            } else {
                if (currentRow.parentPath) {
                    //编辑时，节点后端返回从自身开始的parentPath，应该从根节点开始，后更改为自己的typeId，前端恢复原值
                    data.parentPath = currentRow.parentPath
                    data.children = currentRow.children
                    flag = TreeCache.onEditOneInTree(cacheKey, data, currentRow.parentPath, idKey)
                } else console.warn("no path when edit/update")
            }
            if (flag) dispatch("refreshList-" + listApi) //已更新
        }
    }

    return onSaveOK
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
                saveOne(values as Rule, record, rubleTableProps.saveApi,
                    rubleTableProps.transformBeforeSave, undefined, isAdd,
                    rubleTableProps.listApi, rubleTableProps.cacheKey, rubleTableProps.idKey)
            } else if (fromTable === RuleGroupName) {//新增顶级ruleGroup
                if (debug) console.log("to save top ruleGroup in ruleGroup table...")
                //bugfix：parentIdPath后端返回自己的[typeId]，避免了空
                saveOne(values as RuleGroup, record, rubleGroupTableProps.saveApi,
                    rubleGroupTableProps.transformBeforeSave, undefined, isAdd,
                    rubleGroupTableProps.listApi, rubleGroupTableProps.cacheKey, rubleGroupTableProps.idKey)
            } else {
                console.warn("not support fromTable=" + fromTable)
            }
        } else {// 新增子条目
            const onSaveOK = getOnSaveOk(fromTable, isAdd, debug, rowRuleCommon)

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
            const onSaveOK = getOnSaveOk(fromTable, isAdd, debug, rowRuleCommon)
            //不区分是根节点，由onSaveOK进行区分去更新cache
            if (fromTable === RuleName) {//编辑rule
                if (name === RuleName) {
                    if (debug) console.log("to update rule in rule table...")
                    saveOne(values as Rule, record, rubleTableProps.saveApi,
                        rubleTableProps.transformBeforeSave, onSaveOK
                        //, isAdd,rubleTableProps.listApi, rubleTableProps.cacheKey, rubleTableProps.idKey
                    )
                } else if (name === RuleGroupName) {
                    if (debug) console.log("to update ruleGroup in rule table...")
                    saveOne(values as RuleGroup, record, rubleGroupTableProps.saveApi,
                        rubleGroupTableProps.transformBeforeSave, onSaveOK
                        //, isAdd,rubleTableProps.listApi, rubleTableProps.cacheKey, rubleTableProps.idKey
                    )
                }

            } else if (fromTable === RuleGroupName) {
                if (name === RuleName) {
                    if (debug) console.log("to update rule in ruleGroup table...")
                    saveOne(values as Rule, record, rubleTableProps.saveApi,
                        rubleTableProps.transformBeforeSave, onSaveOK
                        //, isAdd,rubleGroupTableProps.listApi, rubleGroupTableProps.cacheKey, rubleGroupTableProps.idKey
                    )
                }
                else if (name === RuleGroupName) {
                    if (debug) console.log("to update ruleGroup in ruleGroup table...")
                    saveOne(values as RuleGroup, record, rubleGroupTableProps.saveApi,
                        rubleGroupTableProps.transformBeforeSave, onSaveOK
                        // , isAdd,rubleGroupTableProps.listApi, rubleGroupTableProps.cacheKey, rubleGroupTableProps.idKey
                    )

                } else {
                    console.warn("not support fromTable=" + fromTable)
                }
            }
        } else {
            console.warn("not provdide row rule common when edit, fromTable=" + fromTable)
        }

    }
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
    const path = item.parentPath
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
    const onDelOK = (count) => {
        message.success(count + "条被删除")
        if (TreeCache.onDelOneInTree(tableProps.cacheKey, item, item.parentPath, tableProps.idKey)) {
            dispatch("refreshList-" + tableProps.listApi) //删除完毕，发送refreshList，告知ListView去更新
        }
    }
    const delPrefix = "/api/rule/composer"

    if (item.rule) {//删除的是rule
        //待删项是叶子节点
        if (!item.children || item.children.length === 0) {
            if (fromTable === RuleName) {
                if (debug) console.log("to delete leaf rule in rule table...")
                deleteOne(item, rubleTableProps.delApi + "/" + item.id, onDelOK)
            } else if (fromTable === RuleGroupName) {//新增顶级ruleGroup
                if (debug) console.log("to delete leaf rule in ruleGroup table...")
                deleteOne(item, rubleGroupTableProps.delApi + "/" + item.id, onDelOK)
            }
        } else {//待删项不是叶子节点
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
        }
    } else if (item.ruleGroup)//删除的是ruleGroup
    {
        //待删项是叶子节点
        if (!item.children || item.children.length === 0) {
            if (fromTable === RuleName) {
                if (debug) console.log("to delete leaf ruleGroup in rule table...")
                deleteOne(item, rubleGroupTableProps.delApi + "/" + item.id, onDelOK)
            } else if (fromTable === RuleGroupName) {//新增顶级ruleGroup
                if (debug) console.log("to delete leaf ruleGroup in ruleGroup table...")
                deleteOne(item, rubleGroupTableProps.delApi + "/" + item.id, onDelOK)
            }
        } else {//待删项不是叶子节点
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
        }
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
        current: { id: id, type: type }
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
    }

    return cachedFetchPromise<number>(`/api/rule/composer/move`, 'POST', postData)
        .then((data) => {
            if (data) {
                message.warning("移动节点成功")
                console.log("successful to move, update cache")
                const tableProps = moveParam.tableProps
                const flag1 = TreeCache.onDelOneInTree(tableProps.cacheKey, moveParam.currentRow, moveParam.currentRow.parentPath, tableProps.idKey)

                const flag2 = TreeCache.onAddOneInTree(tableProps.cacheKey, moveParam.currentRow,
                    moveParam.newParent?.parentPath, tableProps.idKey, 
                    //因为当前节点变了，需要更新它，便以新父节点以及自己的id，构成自己的新path
                    (parents, parent) => { moveParam.currentRow.parentPath = [...(parent.parentPath), moveParam.currentRow[tableProps.idKey]] })

                if (flag1 || flag2) {
                    dispatch("refreshList-" + tableProps.listApi) //发送refreshList，告知ListView去更新
                }else{
                    console.warn("fail to onDelOneInTree and onAddOneInTree")
                }
            } else {
                console.log("fail to move")
                message.warning("移动节点失败")
            }
            return new Promise((resolve) => { resolve(true) });
        }).catch((err:Error) => {
            console.warn("moveInNewParent exception: " + err.message)
            message.error(err.message)
        })
}




