

import { cachedFetchPromise, cachedGet } from "@rwsbillyang/usecache";
import React from "react";
import { BasicExpression, BasicExpressionMeta, ComplexExpression, ComplexExpressionMeta, Rule, RuleCommon, RuleQueryParams } from "./DataType";
import { basicMeta2Expr, complexMeta2Expr } from "./utils";
import { Button } from "antd";

//import { testTreeSearch } from "@/myPro/TreeUtil";
//testTreeSearch()

export const DevHome: React.FC = () => (<div>
    Welcome to Rule Composer

    <p>
        <Button onClick={correctExpressionRecord}>Correct Expression</Button>
    </p>
    <p>
        <Button onClick={() => getRuleAndConvert(correctRule1, 20, 0)}>Correct1 Rule</Button>
    </p>
    <p>
        <Button onClick={() => getRuleAndConvert(correctRule2)}>Correct2 Rule</Button>
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


function getRuleAndConvert(doSth: (ruleCommon: RuleCommon) => Rule | undefined, pageSize = 20, lastId?: number) {
    const query: RuleQueryParams = { pagination: { pageSize: pageSize, sKey: "id", sort: 1, lastId: lastId?.toString() } }

    cachedGet<RuleCommon[]>("/api/rule/composer/list/rule", (data) => {
        data.forEach((v) => {
            const e = doSth(v)
            if(e) saveOne(e, "/api/rule/composer/save/rule")
        })
         if (data.length >= pageSize) {
             getRuleAndConvert(doSth, pageSize, data[data.length - 1].id)
         }
    }, query)
}

function correctRule1(ruleCommon: RuleCommon) {
    const e = ruleCommon.rule
    if (e) {
        e.meta = e.metaStr ? JSON.parse(e.metaStr) : undefined
        if (e.meta) {
            if (e.meta["metaList"]) {
                e.expr = complexMeta2Expr(e.meta as ComplexExpressionMeta)
            } else {
                e.expr = basicMeta2Expr(e.meta as BasicExpressionMeta)
                // if(expr === -1){
                //     console.log("id="+e.id+", after correct: ", expr, e.meta)
                // }else{
                //     e.expr = expr
                // }

            }
            e.exprStr = JSON.stringify(e.expr)
            e.metaStr = JSON.stringify(e.meta)
            console.log("id=" + e.id + ",rule.expr", e.expr)
            //saveOne(e, "/api/rule/composer/save/rule")
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
function correctRule2(ruleCommon: RuleCommon) {
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