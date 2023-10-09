

import {  cachedFetchPromise, cachedGet } from "@rwsbillyang/usecache";
import React from "react";
import { BasicExpressionMeta, ComplexExpressionMeta,  RuleCommon, RuleQueryParams } from "./DataType";
import { basicMeta2Expr, complexMeta2Expr } from "./utils";
import { Button } from "antd";

//import { testTreeSearch } from "@/myPro/TreeUtil";
//testTreeSearch()

export const DevHome: React.FC = () =>  (<div>
    Welcome to Rule Composer

    <p>
        <Button onClick={correctExpression}>Correct Expression</Button>
    </p>
    <p>
        <Button onClick={()=>getRuleAndConvert(10)}>Correct Rule</Button>
    </p>
</div>)

function saveOne(data: any, url: string){
    cachedFetchPromise<any>(url, 'POST', data)//undefined, StorageType.OnlySessionStorage, undefined,undefined,false
    .then((data) => {
      if (data) {
        console.log("save done")
      }else { console.log("no data return after save") }
      return new Promise((resolve) => { resolve(true) });
    }).catch((err) => {
      console.warn("exception: " + err.message)
    })
}

function correctExpression(){    
    cachedGet<any[]>("/api/rule/composer/list/expression",(data)=>{
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
                console.log("expression=",e)
                saveOne(e, "/api/rule/composer/save/expression")
            }else{
                console.log("no metaStr, id="+e.id)
            }
        })
        
    }, {pagination: { pageSize: -1, sKey: "id", sort: 1 } })

}


function getRuleAndConvert(pageSize= 10, lastId?: number){
    const query:RuleQueryParams = { pagination: { pageSize: pageSize, sKey: "id", sort: 1 , lastId: lastId?.toString()} }
   
    cachedGet<RuleCommon[]>("/api/rule/composer/list/rule",(data)=>{
        data.map((c) => {
            const e = c.rule
            if(e){
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
                    console.log("id="+e.id+",rule.expr",e.expr)
                    saveOne(e, "/api/rule/composer/save/rule")
                }else{
                    console.log("no metaStr, id="+e.id)
                }
            }else{
                console.log("no rule in ruleCommon")
            }
            
        })
        if(data.length >= pageSize){
            getRuleAndConvert(pageSize, data[data.length -1].id)
        }
    }, query)
}