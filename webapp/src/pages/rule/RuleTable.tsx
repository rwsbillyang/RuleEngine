
import React from "react"

import { AllDomainKey, Domain, DomainQueryParams, Rule, RuleCommon, RuleQueryParams } from "../DataType"
import { useSearchParams } from "react-router-dom"
import { DownOutlined } from '@ant-design/icons'

import { MyProTable } from "@/myPro/MyProTable"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { ProColumns } from "@ant-design/pro-table"
import { Host } from "@/Config"


import { defaultProps } from "../moduleTableProps"


import { RuleEditModal } from "./RuleEdit"
import { Dropdown } from "antd"
import { RuleGroupEditModal, initialValuesRuleGroup, rubleGroupTableProps } from "./RuleGroupTable"
import { deleteRuleOrGroup } from "./RuleCommon"
import { basicMeta2Expr, complexMeta2Expr } from "../utils"

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
        hideInSearch: true,
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
        hideInSearch: true,
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

        if (e.meta) {
            e.metaStr = JSON.stringify(e.meta)
            if (e.meta["metaList"]) {
                e.expr = complexMeta2Expr(e.meta)
            } else {
                e.expr = basicMeta2Expr(e.meta)
            }
            e.exprStr = JSON.stringify(e.expr)
        }

        //保存它们对应的string信息
        delete e.meta
        delete e.tagList
        delete e.expr

        return e
    },
    transformBeforeEdit: (e) => { //props.editConfig.convertValue 
        //console.log("transformBeforeEdit...")
        if (!e) return e

        e.tagList = e.tags?.split(",")

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
        <RuleEditModal isAdd={true} record={initialValueRule} fromTable={RuleName} key="addOne" />
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
                        { label: (<RuleEditModal isAdd={true} record={{ ...initialValueRule, domainId: record.domainId, level: (record.level || 0) + 1 }} currentRow={record} fromTable={RuleName} key="addSubRule" />), key: 'subRule' },
                        { label: (<RuleGroupEditModal isAdd={true} record={{ ...initialValuesRuleGroup, domainId: record.domainId, level: (record.level || 0) + 1  }} currentRow={record} fromTable={RuleName} key="addSubRuleGroup" />), key: 'subRuleGroup' }
                    ]
                }}>
                    <a onClick={(e) => e.preventDefault()}> 新增<DownOutlined /> </a>
                </Dropdown>,

                //Edit rule或ruleGroup，根据是哪种类型使用不同的编辑器，没有parent表示不是新增子项，isAdd为false表示编辑
                record.rule ? <RuleEditModal isAdd={false} record={rubleTableProps.transformBeforeEdit ? rubleTableProps.transformBeforeEdit(record.rule) : record.rule} currentRow={record} fromTable={RuleName} key="editOne" /> : undefined,
                record.ruleGroup ? <RuleGroupEditModal isAdd={false} record={rubleGroupTableProps.transformBeforeEdit ? rubleGroupTableProps.transformBeforeEdit(record.ruleGroup) : record.ruleGroup} currentRow={record} fromTable={RuleName} key="editOne" /> : undefined,

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

