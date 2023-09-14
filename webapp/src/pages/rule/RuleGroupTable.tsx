
import React from "react"

import { AllDomainKey, Domain, DomainQueryParams, RuleCommon, RuleGroup, RuleGroupQueryParams } from "../DataType"
import { useSearchParams } from "react-router-dom"
import { DownOutlined } from '@ant-design/icons'
import { MyProTable } from "@/myPro/MyProTable"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { ProColumns } from "@ant-design/pro-table"
import { Host } from "@/Config"


import { Button, Dropdown } from "antd"
import { RuleEditModal } from "./RuleEdit"
import { initialValueRule, rubleTableProps } from "./RuleTable"
import { BetaSchemaForm } from "@ant-design/pro-form"

import { defaultProps } from "../moduleTableProps"

import { deleteRuleOrGroup, saveRuleOrGroup } from "./RuleCommon"


const ruleGroupColumns: ProColumns<RuleCommon>[] = //TableColumnsType<RuleGroup> = 
    [

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
                if (record.rule) return "规则"
                else if (record.ruleGroup) return "规则组"
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
            title: '排他性',
            tooltip: "任意一个rule的条件成立则退出",
            valueType: "switch",
            dataIndex: ['ruleGroup', 'exclusive'],
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
            dataIndex: 'tags',
        },
        {
            title: '备注',
            dataIndex: 'remark',
            valueType: 'textarea',
            ellipsis: true,
            hideInSearch: true
        }
    ]


export const initialValuesRuleGroup: Partial<RuleGroup> = { exclusive: true, enable: true, priority: 50, level: 0 }
export const RuleGroupName = "ruleGroup"
export const rubleGroupTableProps = {
    ...defaultProps(RuleGroupName),
    idKey: "typedId",
    //editForm: (e) => '/rule/editRule',
    transformBeforeSave: (e) => { //props.editConfig.transform, transform(modify shape) before save
        e.tags = e.tagList?.join(",")

        return e
    },
    transformBeforeEdit: (e) => { //props.editConfig.convertValue 
        if (!e) return e
        e.tagList = e.tags?.split(",")
        return e
    }
}

const expandable = {
    //childrenColumnName: "ruleGroupChildren",
    //fixed: "right",
    indentSize: 5
    // expandedRowRender: (record, index, indent, expanded) => {
    //     return <Table columns={ruleGroupColumns} dataSource={record.ruleGroupChildren} pagination={false} />
    // }
}

//基本表达式列表管理
export const RuleGroupTable: React.FC = () => {

    const [searchParams] = useSearchParams();
    const initialQuery: RuleGroupQueryParams = { domainId: searchParams["domainId"], level: 0 }

    const toolBarRender = () => [
        <RuleGroupEditModal isAdd={true} record={initialValuesRuleGroup} fromTable={RuleGroupName} key="addOne" />
    ]
    //自定义编辑
    const actions: ProColumns<RuleCommon> = {
        title: '操作',
        valueType: 'option',
        dataIndex: 'actions',
        render: (dom, record, index, action, schema) => {
            console.log("row.label=" + record.label + ", index=" + index)

            return [
                <Dropdown key="addSub" menu={{
                    items: [
                        //有parent属性表示新增子项，不同类型parentRule、parentGroup只有一个非空
                        { label: (<RuleEditModal isAdd={true} record={{ ...initialValueRule, domainId: record.domainId, level: (record.level || 0) + 1 }} currentRow={record} fromTable={RuleGroupName} key="addSubRule" />), key: 'addSubRule' },
                        { label: (<RuleGroupEditModal isAdd={true} record={{ ...initialValuesRuleGroup, domainId: record.domainId, level: (record.level || 0) + 1 }} currentRow={record} fromTable={RuleGroupName} key="addSubRuleGroup" />), key: 'subRuleGroup' }
                    ]
                }}>
                    <a onClick={(e) => e.preventDefault()}> 新增<DownOutlined /> </a>
                </Dropdown>,

                //Edit rule或ruleGroup，根据是哪种类型使用不同的编辑器，没有parent表示不是新增子项，isAdd为false表示编辑
                record.rule ? <RuleEditModal isAdd={false} record={rubleTableProps.transformBeforeEdit ? rubleTableProps.transformBeforeEdit(record.rule) : record.rule} currentRow={record} fromTable={RuleGroupName} key="editOne" /> : undefined,
                record.ruleGroup ? <RuleGroupEditModal isAdd={false} record={rubleGroupTableProps.transformBeforeEdit ? rubleGroupTableProps.transformBeforeEdit(record.ruleGroup) : record.ruleGroup} currentRow={record} fromTable={RuleGroupName} key="editOne" /> : undefined,

                <a onClick={() => deleteRuleOrGroup(RuleGroupName, record)} key="delete">删除</a>
            ]
        }
    }


    return <MyProTable<RuleCommon, RuleGroupQueryParams>
        {...rubleGroupTableProps}
        expandable={expandable}
        columns={ruleGroupColumns}
        initialQuery={initialQuery}
        initialValues={initialValuesRuleGroup}
        //rowKey={ (record) => record.typedId || "unknown"+record.id }
        toolBarRender={toolBarRender} actions={actions}
    />
}

/**
 * 
 * @param isAdd 编辑还是新增
 * @param record 当前需要编辑的值，新增的话可以使用初始值 经transformBeoforeEdit转换的值
 * @param tableProps 表格属性，保存及更新缓存时需用到里面的信息
 * @param currentRow 在哪个Rule上新增子项或编辑，若是新增顶级节点则为空
 * @returns 
 */
export const RuleGroupEditModal: React.FC<{
    isAdd: boolean,
    record?: Partial<RuleGroup>,
    fromTable: string,
    currentRow?: RuleCommon
}> = ({ isAdd, record,  fromTable, currentRow }) => {


    return <BetaSchemaForm<RuleGroup>
        title="编辑规则组"
        trigger={isAdd ? (currentRow ? <span>子规则组</span> : <Button type="primary">新建</Button>) : <a key="editLink">编辑</a>}
        layoutType="ModalForm"
        initialValues={record}
        columns={ruleGroupColumns as any}
        onFinish={async (values) => {
            saveRuleOrGroup(fromTable, RuleGroupName, values, isAdd, record, currentRow)
            return true
        }}
        layout="horizontal"
    />
}