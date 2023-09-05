
import React from "react"

import { AllDomainKey, Domain, DomainQueryParams, Rule, RuleCommon, RuleQueryParams, basicMeta2Expr } from "../DataType"
import { useSearchParams } from "react-router-dom"
import { DownOutlined } from '@ant-design/icons'

import { MyProTable } from "@/myPro/MyProTable"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { ProColumns } from "@ant-design/pro-table"
import { Host } from "@/Config"


import { defaultProps } from "../moduleTableProps"

//import md5 from "md5"
import { RuleEditModal } from "./RuleEdit"
import { Dropdown } from "antd"
import { RuleGroupEditModal, initialValuesRuleGroup, rubleGroupTableProps } from "./RuleGroupTable"
import { deleteRuleOrGroup } from "./RuleCommon"

const ruleColumns: ProColumns<RuleCommon>[] = [
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
        title: '类型',
        hideInSearch: true,
        hideInForm: true,
        renderText(text, record, index, action) {
            if(record.rule) return "规则"
            else if(record.ruleGroup)return "规则组"
            else return "未知"
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
        title: '优先级',
        tooltip: "值越小越优先执行",
        dataIndex: 'priority',
        valueType: "digit",
        hideInSearch: true
    },

    {
        title: '标签',
        tooltip: "用于搜索过滤规则",
        dataIndex: 'tags',
    },
    {
        title: '备注',
        dataIndex: 'remark',
        valueType: 'textarea',
        ellipsis: true,
        hideInSearch: true
    },

    {
        title: 'Then',
        //hideInTable: true,
        tooltip: "若为true则执行",
        dataIndex: ['rule', 'thenAction'],
        key: "thenAction",
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
        hideInTable: true,
        tooltip: "若为false则执行",
        dataIndex: ['rule', 'elseAction'],
        key: "elseAction",
        valueType: "select"
    },
    {
        title: '可信度',
        hideInTable: true,
        tooltip: "规则执行条件可信度百分比",
        dataIndex: ['rule', 'threshhold'],
        key:"threshhold",
        valueType: "percent"
    },
]





export const RuleName = "rule"
export const initialValueRule: Partial<Rule> = { enable: true, priority: 50, threshhold: 100, level: 0 }
export const rubleTableProps = {
    ...defaultProps(RuleName),
    idKey: "typedId",
    editForm: (e) => '/rule/editRule',
    transformBeforeSave: (e) => { //props.editConfig.transform, transform(modify shape) before save
        e.tags = e.tagList?.join(",")

        // if(e.ruleChildren && e.ruleChildren.length > 0)
        //     e.ruleChildrenIds = e.ruleChildren.map((e)=>e.id).join(",")
        // if(e.ruleGroupChildren && e.ruleGroupChildren.length > 0)
        //     e.ruleGroupChildrenIds = e.ruleGroupChildren.map((e)=>e.id).join(",")

        // if(e.ruleParentIdList && e.ruleParentIdList.length > 0){
        //     e.ruleParentIds = e.ruleParentIdList.join(",")
        // }
        // if(e.ruleGroupParentIdList && e.ruleGroupParentIdList.length > 0){
        //     e.ruleGroupParentIds = e.ruleGroupParentIdList.join(",")
        // }

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
        // if (!e.id) {
        //     if (e.expr) {
        //         if (e.expr["exprs"]) {
        //             //TODO: ComplexExpression
        //             console.warn("TODO: generate id when ComplexExpression")
        //         } else {
        //             //BasicExpression
        //             const expr: BasicExpression = e.expr as BasicExpression
        //             let msg = `domainId=${e.domainId}`
        //             msg += `&key=${expr.op}`
        //             msg += opValue2Md5Msg("other", expr.other)
        //             msg += opValue2Md5Msg("start", expr.start)
        //             msg += opValue2Md5Msg("end", expr.end)
        //             msg += opValue2Md5Msg("set", expr.set)
        //             msg += opValue2Md5Msg("e", expr.e)
        //             msg += opValue2Md5Msg("num", expr.num)

        //             e.id = md5(msg) //md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
        //         }
        //     } else {
        //         console.warn("no expr to generate id")
        //     }
        // }

        //保存它们对应的string信息
        delete e.meta
        delete e.tagList
        delete e.expr
    
        //delete e.ruleChildren
        //delete e.ruleGroupChildren
        //delete e.ruleParentIdList
        //delete e.ruleGroupParentIdList

        return e
    },
    transformBeforeEdit: (e) => { //props.editConfig.convertValue 
        //console.log("transformBeforeEdit...")
        if (!e) return e

        e.tagList = e.tags?.split(",")

        // e.ruleParentIdList = e.ruleParentIds?.split(",")
        //e.ruleGroupParentIdList = e.ruleGroupParentIds?.split(",")

        if (e.metaStr) {
            e.meta = JSON.parse(e.metaStr)
        }
        if (e.exprStr) {
            e.expr = JSON.parse(e.exprStr)
        }

        return e
    }
}


const expandable = {
    //childrenColumnName: "ruleChildren",
    //fixed: "right",
    indentSize: 5
    // expandedRowRender: (record, index, indent, expanded) => {
    //     return <Table columns={ruleGroupColumns} dataSource={record.ruleGroupChildren} pagination={false} />
    // }
}

//基本表达式列表管理
export const RuleTable: React.FC = () => {

    const [searchParams] = useSearchParams();
    const initialQuery: RuleQueryParams = { domainId: searchParams["domainId"], level: 0 }

    //新增和编辑将全部转移到自定义的
    const toolBarRender = () => [
        <RuleEditModal isAdd={true} record={initialValueRule} tableProps={rubleTableProps} fromTable={RuleName} key="addOne" />
    ]

    //自定义编辑
    const actions: ProColumns<RuleCommon> = {
        title: '操作',
        valueType: 'option',
        dataIndex: 'actions',
        render: (dom, record, index, action, schema) => {
            //console.log("row.label=" + record.label + ", index=" + index)

            return [
                <Dropdown key="addSub" menu={{
                    items: [
                        //有parent属性表示新增子项，不同类型parentRule、parentGroup只有一个非空
                        { label: (<RuleEditModal isAdd={true} record={{ ...initialValueRule, domainId: record.domainId, level: (record.level || 0) + 1 }} currentRow={record} tableProps={rubleTableProps} fromTable={RuleName} key="addSubRule" />), key: 'subRule' },
                        { label: (<RuleGroupEditModal isAdd={true} record={{ ...initialValuesRuleGroup, domainId: record.domainId, level: (record.level || 0) + 1  }} currentRow={record}  tableProps={rubleGroupTableProps} fromTable={RuleName} key="addSubRuleGroup" />), key: 'subRuleGroup' }
                    ]
                }}>
                    <a onClick={(e) => e.preventDefault()}> 新增<DownOutlined /> </a>
                </Dropdown>,

                //Edit rule或ruleGroup，根据是哪种类型使用不同的编辑器，没有parent表示不是新增子项，isAdd为false表示编辑
                record.rule ? <RuleEditModal isAdd={false} record={rubleTableProps.transformBeforeEdit ? rubleTableProps.transformBeforeEdit(record.rule) : record.rule} currentRow={record} tableProps={rubleTableProps} fromTable={RuleName} key="editOne" /> : undefined,
                record.ruleGroup ? <RuleGroupEditModal isAdd={false} record={rubleGroupTableProps.transformBeforeEdit ? rubleGroupTableProps.transformBeforeEdit(record.ruleGroup) : record.ruleGroup} currentRow={record} tableProps={rubleGroupTableProps} fromTable={RuleName} key="editOne" /> : undefined,

                <a onClick={() => deleteRuleOrGroup(RuleName, record)} key="delete">删除</a>
            ]
        }
    }

    return <MyProTable<RuleCommon, RuleQueryParams> 
    {...rubleTableProps} 
    myTitle="规则" 
    expandable={expandable} 
    columns={ruleColumns} 
    initialQuery={initialQuery} 
    initialValues={initialValueRule}
    //rowKey={ (record) => record.typedId  }
    toolBarRender={toolBarRender} actions={actions} //注释掉此行，将跳到新的页面RuleEdit，否则使用Modal对话框
    />
}


