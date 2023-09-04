import { UseCacheConfig, Cache } from "@rwsbillyang/usecache"
import { Rule, RuleCommon, RuleGroup } from "../DataType"
import { RuleName, rubleTableProps } from "./RuleTable"
import { dispatch } from "use-bus"
import { deleteOne, saveOne } from "@/myPro/MyProTable"
import { RuleGroupName, rubleGroupTableProps } from "./RuleGroupTable"
import { getElementsByPathIdsInTreeFromCache, removeOneFromArray } from "@/myPro/TreeUtil"
import { message } from "antd"

export const SaveSubInRuleAPI = "/api/rule/composer/saveSubInRule/" //   {name}/{parentRuleId}"
export const SaveSubInRuleGroupAPI = "/api/rule/composer/saveSubInRuleGroup/" //   {name}/{parentRuleId}"



/**
 * 
 * @param fromTable 从哪个表格中进行的新增或编辑操作，涉及到使用MyProTableProps中的缓存
 * @param name 要保存的是rule还是ruleGroup
 * @param values 要保存的值
 * @param isAdd 是否新增
 * @param record 原始旧记录
 * @param parentRule 在哪个Rule上新增子项 新增子项时必传
 * @param parentGroup 在哪个RuleGroup上新增子项 新增子项时必传
 * @param debug 日志输出开关
 */
export function saveRuleOrGroup(
    fromTable: string,
    name: string,
    values: Rule | RuleGroup,
    isAdd: boolean,
    record?: Partial<Rule> | Partial<RuleGroup>,
    parentRuleCommon?: RuleCommon,
    parentGroupCommon?: RuleCommon,
    debug: boolean = true) {


    //新增顶级root
    if (!parentRuleCommon && !parentGroupCommon) {
        if (fromTable === RuleName) {//新增顶级rule
            if (debug) console.log("to save top rule in rule table...")
            saveOne(values as Rule, record, rubleTableProps.saveApi,
                rubleTableProps.transformBeforeSave, undefined, isAdd,
                rubleTableProps.listApi, rubleTableProps.cacheKey, rubleTableProps.idKey)//后端返回的是Rule
        } else if (fromTable === RuleGroupName) {//新增顶级ruleGroup
            if (debug) console.log("to save top ruleGroup in ruleGroup table...")
            saveOne(values as RuleGroup, record, rubleGroupTableProps.saveApi,
                rubleGroupTableProps.transformBeforeSave, undefined, isAdd,
                rubleGroupTableProps.listApi, rubleGroupTableProps.cacheKey, rubleGroupTableProps.idKey)//后端返回的是Rule
        } else {
            console.warn("not support fromTable=" + fromTable)
        }
    } else {// 新增子条目
        const onSaveOK = (data: RuleCommon) => {//后端返回的是RuleCommon
            //构建相互指向的父子关系，后端处理保存亲子关系

            let cacheKey, idKey, listApi, log
            if (fromTable === RuleName) {
                cacheKey = rubleTableProps.cacheKey
                idKey = rubleTableProps.idKey || UseCacheConfig.defaultIdentiyKey || "id"
                listApi = rubleTableProps.listApi
                if (debug) log = "to update rule table cache..."
            } else if (fromTable === RuleGroupName) {
                cacheKey = rubleGroupTableProps.cacheKey
                idKey = rubleGroupTableProps.idKey || UseCacheConfig.defaultIdentiyKey || "id"
                listApi = rubleGroupTableProps.listApi
                if (debug) log = "to update ruleGroup table cache..."
            }

            //树形遍历，找到树形的根，然后保存到缓存
            if (cacheKey) {
                if (debug) console.log(log)
                const path = parentRuleCommon?.parentPath || parentGroupCommon?.parentPath
                //新增子项时，从根节点到当前项的节点id数组，用于更新根节点缓存 新增子项时必传
                if (path && path.length > 0) {
                    const elemPath = getElementsByPathIdsInTreeFromCache(cacheKey, path, "id")//树形数据转换成数组
                    if (elemPath && elemPath.length > 0) {
                        const lastOne = elemPath[elemPath.length - 1]//最后一个，也就是添加到该项下面
                        data.parentPath = [...lastOne.parentPath, data.id] //后端并未从根上查询，所以借用父项的parentPath，然后加上自己构成完成的path链条
                        if (!lastOne["children"]) {
                            lastOne["children"] = [data]
                        } else {
                            lastOne["children"].push(data)
                        }

                        Cache.onEditOne(cacheKey, path[0], idKey)//更新根节点缓存数据
                        dispatch("refreshList-" + listApi) //上面已更新parentRule数据
                    } else {
                        //create sub from top
                        console.warn("not found element path in tree")
                    }
                } else {
                    console.log("should not come here")
                }
            }
        }


        if (parentRuleCommon) {//在rule下新增
            //values.level = (parentRuleCommon.level || 0) + 1
            if (name === RuleName) {//新增rule
                if (debug) console.log("to save sub rule in parent rule...")
                saveOne(values as Rule, record,
                    SaveSubInRuleAPI + name + "/" + parentRuleCommon.id,
                    rubleTableProps.transformBeforeSave,
                    onSaveOK)
            } else if (name === RuleGroupName) {//新增ruleGroup
                if (debug) console.log("to save sub ruleGroup in parent rule...")
                saveOne(values as RuleGroup, record,
                    SaveSubInRuleAPI + name + "/" + parentRuleCommon.id,
                    rubleGroupTableProps.transformBeforeSave,
                    onSaveOK)
            } else
                console.warn("not support name=" + name)
        } else if (parentGroupCommon) {//在ruleGroup下新增
            values.level = (parentGroupCommon.level || 0) + 1
            if (name === RuleName) {//新增rule
                if (debug) console.log("to save sub rule in parent ruleGroup...")
                saveOne(values as Rule, record,
                    SaveSubInRuleGroupAPI + name + "/" + parentGroupCommon.id,
                    rubleTableProps.transformBeforeSave,
                    onSaveOK)
            } else if (name === RuleGroupName) {//新增ruleGrou
                if (debug) console.log("to save sub ruleGroup in parent ruleGroup...")
                saveOne(values as RuleGroup, record,
                    SaveSubInRuleGroupAPI + name + "/" + parentGroupCommon.id,
                    rubleGroupTableProps.transformBeforeSave,
                    onSaveOK)
            } else
                console.warn("not support name=" + name)
        }
    }
}


/**
 * 删除时，需要知道待删除行的RuleCommon、父行（若为空，则待删除行为树的根），删除完需刷新列表（需知道是哪个列表、根到自身的路径）
 * @param fromTable 来自哪个table中的删除操作：若是rule，则是在ruleTable表中删除，删除成功后则更新ruleTableProps中参数指定的缓存；若是ruleGroup，则类似
 * @param item 删除对象：  RuleCommon
 * @param parentRuleCommon 删除对象的父对象，parentRuleCommon 与 parentGroupCommon 可能同时为空（删除的是根节点），可能其中一个为空
 * @param parentGroupCommon 删除对象的父对象，parentRuleCommon 与 parentGroupCommon 可能同时为空（删除的是根节点），可能其中一个为空
 */
export function deleteRuleOrGroup(
    fromTable: string,
    item: RuleCommon,
    // parentRuleCommon?: RuleCommon,
    // parentGroupCommon?: RuleCommon,
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
    const path = item.parentPath
    if (path.length > 1) {
        const elemPath = getElementsByPathIdsInTreeFromCache(tableProps.cacheKey, path, "id")//树形数据转换成数组
        if (elemPath) {
            const p = elemPath[elemPath?.length - 2]
            parent = p
            if (p.rule) parentRuleCommon = parent
            else if (p.ruleGroup) parentGroupCommon = parent
            else console.warn("Should not come here2")
        }
    }


    //刷新缓存
    const onDelOK = (count) => {

        if (!parent) {//删除的是根节点 或根据item.level===0 or item.parentPath.length === 1 判断
            if (tableProps.cacheKey) Cache.onDelOneById(tableProps.cacheKey, item.id, tableProps.idKey)
        } else {//删除的是子节点，需：更新父节点的children（清除删除项），再更新父路径path中的根节点缓存
            //将删除项从父项的children中删除
            if (parent.children) removeOneFromArray(parent.children, item.id, "id")

            //刷新列表
            Cache.onEditOne(tableProps.cacheKey, path[0], tableProps.idKey)//更新根节点缓存数
        }

        message.success(count + "条被删除")

        dispatch("refreshList-" + tableProps.listApi) //删除完毕，发送refreshList，告知ListView去更新
    }


    if (item.rule) {//删除的是rule
        //待删项是叶子节点
        if (!item.children || item.children.length === 0) {
            if (fromTable === RuleName) {
                if (debug) console.log("to delete leaf rule in rule table...")
                deleteOne(rubleTableProps, item.rule, undefined, onDelOK)
            } else if (fromTable === RuleGroupName) {//新增顶级ruleGroup
                if (debug) console.log("to delete leaf rule in ruleGroup table...")
                deleteOne(rubleGroupTableProps, item.rule, undefined, onDelOK)
            }
        } else {//待删项不是叶子节点
            if (fromTable === RuleName) {
                if (parentRuleCommon) {
                    if (debug) console.log("to delete sub rule of parentRule in rule table...")
                    deleteOne(rubleTableProps, item.rule, `/delSubInParentRule/${RuleName}/${item.id}/${parentRuleCommon.id}`, onDelOK)
                } else if (parentGroupCommon) {
                    if (debug) console.log("to delete sub rule of parentGroup in rule table...")
                    deleteOne(rubleTableProps, item.rule, `/delSubInParentGroup/${RuleName}/${item.id}/${parentGroupCommon.id}`, onDelOK)
                } else {//item is root
                    if (debug) console.log("to delete root rule in rule table...")
                    deleteOne(rubleTableProps, item.rule, `/delSubInParentRule/${RuleName}/${item.id}`, onDelOK)
                }
            } else if (fromTable === RuleGroupName) {
                if (parentRuleCommon) {
                    if (debug) console.log("to delete sub rule of parentRule in ruleGroup table...")
                    deleteOne(rubleGroupTableProps, item.rule, `/delSubInParentRule/${RuleName}/${item.id}/${parentRuleCommon.id}`, onDelOK)
                } else if (parentGroupCommon) {
                    if (debug) console.log("to delete sub rule of parentGroup in ruleGroup table...")
                    deleteOne(rubleGroupTableProps, item.rule, `/delSubInParentGroup/${RuleName}/${item.id}/${parentGroupCommon.id}`, onDelOK)
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
                deleteOne(rubleTableProps, item.ruleGroup, undefined, onDelOK)
            } else if (fromTable === RuleGroupName) {//新增顶级ruleGroup
                if (debug) console.log("to delete leaf ruleGroup in ruleGroup table...")
                deleteOne(rubleGroupTableProps, item.ruleGroup, undefined, onDelOK)
            }
        } else {//待删项不是叶子节点
            if (fromTable === RuleName) {
                if (parentRuleCommon) {
                    if (debug) console.log("to delete sub ruleGroup of parentRule in rule table...")
                    deleteOne(rubleTableProps, item.ruleGroup, `/delSubInParentRule/${RuleGroupName}/${item.id}/${parentRuleCommon.id}`, onDelOK)
                } else if (parentGroupCommon) {
                    if (debug) console.log("to delete sub ruleGroup of parentGroup in rule table...")
                    deleteOne(rubleTableProps, item.ruleGroup, `/delSubInParentGroup/${RuleGroupName}/${item.id}/${parentGroupCommon.id}`, onDelOK)
                } else {//item is root
                    console.warn("Error: should not come here: to delete root ruleGroup in rule table")
                }
            } else if (fromTable === RuleGroupName) {
                if (parentRuleCommon) {
                    if (debug) console.log("to delete sub ruleGroup of parentRule in ruleGroup table...")
                    deleteOne(rubleGroupTableProps, item.ruleGroup, `/delSubInParentRule/${RuleGroupName}/${item.id}/${parentRuleCommon.id}`, onDelOK)
                } else if (parentGroupCommon) {
                    if (debug) console.log("to delete sub ruleGroup of parentGroup in ruleGroup table...")
                    deleteOne(rubleGroupTableProps, item.ruleGroup, `/delSubInParentGroup/${RuleGroupName}/${item.id}/${parentGroupCommon.id}`, onDelOK)
                } else {//item is root
                    if (debug) console.log("to delete root ruleGroup in ruleGroup table...")
                    deleteOne(rubleGroupTableProps, item.ruleGroup, `/delSubInParentGroup/${RuleGroupName}/${item.id}`, onDelOK)

                }
            } else {
                console.warn("Error: should not come here:  not support from table=" + fromTable)
            }
        }
    } else {
        console.warn("should not come here1")
    }
}






