
import React, { useRef, useState } from "react"

import { AllDomainKey, Domain, DomainQueryParams, RuleCommon, RuleGroup, RuleGroupQueryParams } from "../DataType"
import { useSearchParams } from "react-router-dom"

import { MyProTable } from "@/myPro/MyProTable"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { ProColumns } from "@ant-design/pro-table"
import { Host } from "@/Config"


import { Button, Dropdown, message } from "antd"
import { RuleEditModal } from "./RuleEdit"
import { initialValueRule, rubleTableProps } from "./RuleTable"
import { BetaSchemaForm } from "@ant-design/pro-form"

import { defaultProps, mustFill } from "../moduleTableProps"

import { deleteRuleOrGroup, saveRuleOrGroup } from "./RuleCommon"
import { ArrayUtil } from "@rwsbillyang/usecache"
import { MoveIntoNewParentModal, MoveNodeParam } from "./MoveRuleNode"


export const statusOptions = [{value:0, label: "关闭"}, {value:1, label: "打开"}]

const ruleGroupColumns: ProColumns<RuleCommon>[] = //TableColumnsType<RuleGroup> = 
    [
        {
            title: '名称',
            dataIndex: 'label',
            formItemProps: mustFill
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
            hideInTable: true,
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
            valueType: "select",
            //valueEnum: {0: "关闭", 1: "打开"},
            fieldProps:{ options:statusOptions },
            dataIndex: 'exclusive',
            hideInTable: true,
        },
        {
            title: '状态',
            dataIndex: 'enable',
            valueType: "select",
            //valueEnum: {0: "禁用", 1: "可用"},
            fieldProps:{ options: statusOptions },
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
            title: '说明',
            dataIndex: 'description',
            valueType: 'textarea',
            ellipsis: true,
            //hideInTable: true,
            hideInSearch: true
        },
        {
            title: '备注',
            dataIndex: 'remark',
            valueType: 'textarea',
            ellipsis: true,
            hideInTable: true,
            hideInSearch: true
        }
    ]


export const initialValuesRuleGroup: Partial<RuleGroup> = { exclusive: 1, enable: 1, priority: 50, level: 0 }
export const RuleGroupName = "ruleGroup" //typedId以此开头
export const rubleGroupTableProps = {
    ...defaultProps(RuleGroupName, false),
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
    const [path, setPath] = useState<string[]>()
    const [moveParam, setMoveParam] = useState<MoveNodeParam>()
    const { current } = useRef<{ treeData?: RuleCommon[] }>({}) //移动节点时，用于作为树形选择器的数据

    const toolBarRender = () => [
        <RuleGroupEditModal isAdd={true} record={initialValuesRuleGroup} fromTable={RuleGroupName} key="addOne" />,
        path ? <a onClick={() => { setPath(undefined) }} key="viewAll">恢复查看全部</a> : undefined
    ].filter(e => !!e)

    //自定义操作
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
                        { label: (<RuleEditModal isAdd={true} record={{ ...initialValueRule, domainId: record.domainId, level: (record.level || 0) + 1 }} currentRow={record} fromTable={RuleGroupName} key="addSubRule" />), key: 'addSubRule' },
                        { label: (<RuleGroupEditModal isAdd={true} record={{ ...initialValuesRuleGroup, domainId: record.domainId, level: (record.level || 0) + 1 }} currentRow={record} fromTable={RuleGroupName} key="addSubRuleGroup" />), key: 'subRuleGroup' }
                    ]
                }}>
                    <a onClick={(e) => e.preventDefault()}> 新增 </a>
                </Dropdown>,

                //Edit rule或ruleGroup，根据是哪种类型使用不同的编辑器，没有parent表示不是新增子项，isAdd为false表示编辑
                record.rule ? <RuleEditModal isAdd={false} record={rubleTableProps.transformBeforeEdit ? rubleTableProps.transformBeforeEdit(record.rule) : record.rule} currentRow={record} fromTable={RuleGroupName} key="editOne" /> : undefined,
                record.ruleGroup ? <RuleGroupEditModal isAdd={false} record={rubleGroupTableProps.transformBeforeEdit ? rubleGroupTableProps.transformBeforeEdit(record.ruleGroup) : record.ruleGroup} currentRow={record} fromTable={RuleGroupName} key="editOne" /> : undefined,

                <Dropdown key="more" menu={{
                    items: [
                        { label: (<a onClick={() => { setPath(record.posPath) }} key="viewOnlyNode">只看当前</a>), key: 'viewOnlyNode' },
                        { label: (<a onClick={() => { 
                            if(current.treeData)
                                setMoveParam({fromTable: RuleGroupName, list: current.treeData, currentRow: record})
                            else message.warning("no list tree data")
                            }} key="moveNode">移动</a>), key: 'moveNode' },
                        { label: (<a onClick={() => deleteRuleOrGroup(RuleGroupName, record)} key="delete">删除</a>), key: 'delete' },
                    ]
                }}>
                    <a onClick={(e) => e.preventDefault()}> 更多.. </a>
                </Dropdown>,   
            ].filter(e=>!!e)
        }
    }



    return <>
        <MyProTable<RuleCommon, RuleGroupQueryParams>
            {...rubleGroupTableProps}
            expandable={expandable}
            columns={ruleGroupColumns}
            initialQuery={initialQuery}
            initialValues={initialValuesRuleGroup}
            listTransformArgs={path}
            listTransform={(list: RuleCommon[], path?: any) => {
                ArrayUtil.traverseTree(list, (e) => {
                    const children = e.children
                    if(children && children.length > 0)
                        e.children = children.sort((a,b)=>(a.priority||50) - (b.priority||50))
                })
                list.sort((a,b)=>(a.priority||50) - (b.priority||50))
                
                current.treeData = list //记录下当前全部树形数据
                if (!path) return list
                const root = ArrayUtil.trimTreeByPath(list, path, rubleGroupTableProps.idKey)
                //console.log("after trim, root=",root)
                return root ? [root] : list
            }}

            //rowKey={ (record) => record.typedId || "unknown"+record.id }
            toolBarRender={toolBarRender} actions={actions}
        />
        <MoveIntoNewParentModal param={moveParam} setParam={setMoveParam}/>
    </>
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
}> = ({ isAdd, record, fromTable, currentRow }) => {


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