
import React from "react"

import { AllDomainKey, BasicExpression, Domain, DomainQueryParams, Rule, RuleQueryParams, basicMeta2Expr, opValue2Md5Msg } from "../DataType"
import { useSearchParams } from "react-router-dom"


import { MyProTable } from "@/myPro/MyProTable"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { ProColumns } from "@ant-design/pro-table"
import { Host } from "@/Config"


import { moduleTableProps } from "../moduleTableProps"

import md5 from "md5"

const ruleColumns: ProColumns[] = [
    {
        title: '名称',
        dataIndex: 'label',
        formItemProps: {
            rules: [
              {
                required: true,
                message: '此项为必填项',
              },
            ],
          },
    },
    {
        title: '所属',
        key: "domainId",
        dataIndex: ['domain', 'label'],
        request: () => asyncSelectProps2Request<Domain, DomainQueryParams>({
            key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
            url: `${Host}/api/rule/composer/list/domain`,
            query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },
            convertFunc: (item) => { return { label: item.label, value: item.id } }
        })
    },
    {
        title: '状态',
        valueType: "switch",
        dataIndex: 'enable',
    },
    {
        title: 'Then',
        tooltip: "若为true则执行",
        dataIndex: 'thenAction',
        valueType: "select",
        formItemProps: {
            rules: [
              {
                required: true,
                message: '此项为必填项',
              },
            ],
          },
    },
    {
        title: 'Else',
        tooltip: "若为false则执行",
        dataIndex: 'elseAction',
        valueType: "select"
    },
    {
        title: '优先级',
        tooltip: "值越小越优先执行",
        dataIndex: 'priority',
        valueType: "digit",
        hideInSearch: true
    },
    {
        title: '可信度',
        tooltip: "规则执行条件可信度百分比",
        dataIndex: 'threshhold',
        valueType: "percent"
    },
    {
        title: '标签',
        tooltip: "用于搜索过滤规则",
        dataIndex: 'tagList',
        renderText: (text, row) => row.tagList?.join(","),
    },
    {
        title: '备注',
        dataIndex: 'remark',
        valueType: 'textarea',
        ellipsis: true,
        hideInSearch: true
    },
]



const expandable = {
    childrenColumnName: "ruleChildren",
    // expandedRowRender: (record, index, indent, expanded) => {
    //     return <Table columns={ruleGroupColumns} dataSource={record.ruleGroupChildren} pagination={false} />
    // }
}


export const rubleTableProps = moduleTableProps<Rule>({
    title: "规则", name: "rule",
    edit: (e) => '/rule/editRule',
    transform: (e) => { //props.editConfig.transform, transform(modify shape) before save
        e.tags = e.tagList?.join(",")
        if (e.meta) {
            e.metaStr = JSON.stringify(e.meta)
            if (e.meta["metaList"]) {
                //TODO: e.expr = complexMeta2Expr(e.meta)
                console.warn("TODO: generate exprStr when ComplexExpressionMeta")
            } else {
                e.expr = basicMeta2Expr(e.meta)
            }
            e.exprStr = JSON.stringify(e.expr)
        }

        //生成id，同样的条件将是更新
        if (!e.id) {
            if (e.expr) {
                if (e.expr["exprs"]) {
                    //TODO: ComplexExpression
                    console.warn("TODO: generate id when ComplexExpression")
                } else {
                    //BasicExpression
                    const expr: BasicExpression = e.expr as BasicExpression
                    let msg = `domainId=${e.domainId}`
                    msg += `&key=${expr.op}`
                    msg += opValue2Md5Msg("other", expr.other)
                    msg += opValue2Md5Msg("start", expr.start)
                    msg += opValue2Md5Msg("end", expr.end)
                    msg += opValue2Md5Msg("set", expr.set)
                    msg += opValue2Md5Msg("e", expr.e)
                    msg += opValue2Md5Msg("num", expr.num)

                    e.id = md5(msg) //md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
                }
            } else {
                console.warn("no expr to generate id")
            }

        }


        delete e.meta
        delete e.tagList
        delete e.expr

        return e
    },
    convertValue: (e) => { //props.editConfig.convertValue 
        e.tagList = e.tags?.split(",")
        if (e.metaStr) {
            e.meta = JSON.parse(e.metaStr)
        }
        if (e.exprStr) {
            e.expr = JSON.parse(e.exprStr)
        }
        return e
    }
})


//基本表达式列表管理
export const RuleTable: React.FC = () => {
    //const name = "rule"
    const [searchParams] = useSearchParams();
    const initialQuery: RuleQueryParams = { domainId: searchParams["domainId"] }


    return <MyProTable<Rule, RuleQueryParams> {...rubleTableProps} expandable={expandable} columns={ruleColumns} initialQuery={initialQuery}
        initialValues={{ enable: true, priority: 50, threshhold: 100 }}
    />
}






