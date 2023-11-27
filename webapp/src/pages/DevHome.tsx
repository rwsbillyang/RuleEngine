

import { cachedFetchPromise, cachedGet } from "@rwsbillyang/usecache";
import React from "react";
import { BasicExpression, BasicExpressionMeta, ComplexExpression, ComplexExpressionMeta, Rule, RuleCommon, RuleQueryParams } from "./DataType";
import { basicMeta2Expr, complexMeta2Expr, removeBasicExpressionMetaFields, removeComplexExpressionMetaFields } from "./utils";
import { Button } from "antd";

//import { testTreeSearch } from "@/myPro/TreeUtil";
//testTreeSearch()

export const DevHome: React.FC = () => (<div>
    Welcome to Rule Composer

    <p>
        <Button onClick={correctExpressionRecord}>Correct Expression</Button>
    </p>
    <p>
        <Button onClick={() => loopQueryRulePage(doSth_correctRule1, 20, 20)}>Correct1 Rule</Button>
    </p>
    <p>
        <Button onClick={() => loopQueryRulePage(doSth_correctRule2)}>Correct2 Rule</Button>
    </p>
</div>)

function saveOne(data: any, url: string) {
    cachedFetchPromise<any>(url, 'POST', data)//undefined, StorageType.OnlySessionStorage, undefined,undefined,false
        .then((data) => {
            if (data) {
                console.log("save done")
            } else { console.log("no data return after save") }
            return new Promise((resolve) => { resolve(true) });
        }).catch((err) => {
            console.warn("exception: " + err.message)
        })
}

function correctExpressionRecord() {
    cachedGet<any[]>("/api/rule/composer/list/expression", (data) => {
        data.map((e) => {
            e.meta = e.metaStr ? JSON.parse(e.metaStr) : undefined
            if (e.meta) {
                if (e.meta["metaList"]) {
                    e.expr = complexMeta2Expr(e.meta)
                } else {
                    e.expr = basicMeta2Expr(e.meta)
                }
                e.exprStr = JSON.stringify(e.expr)
                e.metaStr = JSON.stringify(e.meta)
                console.log("expression=", e)
                saveOne(e, "/api/rule/composer/save/expression")
            } else {
                console.log("no metaStr, id=" + e.id)
            }
        })

    }, { pagination: { pageSize: -1, sKey: "id", sort: 1 } })

}


function loopQueryRulePage(doSth: (ruleCommon: RuleCommon) => Rule | undefined, pageSize = 20, lastId?: number) {
    const query: RuleQueryParams = { pagination: { pageSize: pageSize, sKey: "id", sort: 1, lastId: lastId?.toString() } }

    cachedGet<RuleCommon[]>("/api/rule/composer/list/rule", (data) => {
        data.forEach((v) => {
            const e = doSth(v)
            if(e) saveOne(e, "/api/rule/composer/save/rule")
            else console.log("e is undefined after doSth")
        })
         if (data.length >= pageSize) {
            loopQueryRulePage(doSth, pageSize, data[data.length - 1].id)
         }
    }, query)
}

function doSth_correctRule1(ruleCommon: RuleCommon) {
    const e = ruleCommon.rule
    if (e) {
        e.meta = e.metaStr ? JSON.parse(e.metaStr) : undefined
        if (e.meta) {
            if (e.meta["metaList"]) {
                const m = e.meta as ComplexExpressionMeta
                e.expr = complexMeta2Expr(m)
                removeComplexExpressionMetaInOperands(m,"starCat")
                removeComplexExpressionMetaFields(m)
            } else {
                const m = e.meta as BasicExpressionMeta
                e.expr = basicMeta2Expr(m)
                removeBasicExpressionMetaFieldsInOperands(m, "starCat")
                removeBasicExpressionMetaFields(m)
            }
            e.metaStr = JSON.stringify(e.meta)
            e.exprStr = JSON.stringify(e.expr)
            
            //console.log("id=" + e.id + ",rule.expr", e.expr)

            return e
        } else {
            console.log("no metaStr, id=" + e.id)
        }
    } else {
        console.log("no rule in ruleCommon")
    }
    return undefined
}

//Deprecated: 每个自定义paramType使用自己的op，可重名（系统里存在多条记录，因为可能有自己的不同操作数配置），互不覆盖
//只更新了exprStr，未更新metaStr
//Star: jian -> huiHe, gongZhao -> zhao, jia -> neibours
function doSth_correctRule2(ruleCommon: RuleCommon) {
    const e = ruleCommon.rule
    if (e) {
        e.expr = e.exprStr ? JSON.parse(e.exprStr) : undefined
        if (e.expr) {
            let ret = false
            if (e.expr["exprs"]) {
                ret = correctComplexExpression(e.id, e.expr as ComplexExpression)
            } else {
                ret = correctBasicExpression(e.id, e.expr as BasicExpression)
            }
            e.exprStr = JSON.stringify(e.expr)
           
            console.log("id=" + e.id + "ret="+ ret + ", rule.expr", e.expr)
          
            return e
        } else {
            console.log("no metaStr, id=" + e.id)
        }
    } else {
        console.log("no rule in ruleCommon")
    }
    return undefined
}
//Star: jian -> huiHe, gongZhao -> zhao, jia -> neibours
 const correctBasicExpression = (id: number, expr: BasicExpression) => {
    if(expr._class === "Star"){
        const code = expr.op
        if(!code){
            console.warn("no op code, id="+id)
            return false
        }
        if(code === "jian"){
            expr.op = "huiHe"
            return true
        }else if(code === "zhao"){
            expr.op = "huiHe"
            return true
        }else if(code === "jia"){
            expr.op = "neibours"
            return true
        }
    }

    return false
}
//数据量过大，尤其某些复合表达式数据量超过字段存储空间
 const correctComplexExpression = (id: number, expr: ComplexExpression) => {
    let ret = false
    expr.exprs.forEach((e) => {
        if (e._class === "Complex") {
            ret = correctComplexExpression(id, e as ComplexExpression) || ret
        } else {
            ret = correctBasicExpression(id, e as BasicExpression) || ret
        }
    })
    return ret
}

//bug，导致无提交保存动作
const removeBasicExpressionMetaFieldsInOperands = (meta: BasicExpressionMeta, field: string) =>{
    const oprands = meta.operandMetaObj
    Object.keys(oprands).forEach(key => {
        if(field === key)
        {
            delete oprands[key]
        }
    })
} 
const removeComplexExpressionMetaInOperands = (meta: ComplexExpressionMeta, field: string) =>{
    meta.metaList.forEach((e) => {
        if (e._class === "Complex") {
            removeComplexExpressionMetaInOperands(e as ComplexExpressionMeta, field)
        } else {
            removeBasicExpressionMetaFieldsInOperands(e as BasicExpressionMeta, field)
        }
    })
} 
