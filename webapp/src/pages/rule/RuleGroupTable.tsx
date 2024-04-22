
import React, { useRef, useState } from "react"

import { AllDomainKey, Domain, DomainQueryParams, RuleCommon, RuleGroup, RuleGroupQueryParams } from "../DataType"
import { useSearchParams } from "react-router-dom"

import { EasyProTable, asyncSelectProps2Request } from "easy-antd-pro"
import { ProColumns } from "@ant-design/pro-table"
import { Host } from "@/Config"

import { PlusCircleTwoTone, MinusCircleTwoTone } from "@ant-design/icons";
import { Dropdown, Spin, message } from "antd"
import { AddChildModal, AddParentModal, RuleEditModal, RuleGroupEditModal } from "./RuleOrGroupEdit"
import { RuleName, initialValueRule, rubleTableProps } from "./RuleTable"


import { defaultProps, mustFill } from "../moduleTableProps"

import { deleteRuleOrGroup } from "./RuleCommon"
import { ArrayUtil, cachedFetch } from "@rwsbillyang/usecache"
import { MoveIntoNewParentModal, MoveNodeParam } from "./MoveRuleNode"
import { ExpandableConfig } from "antd/lib/table/interface"
import { dispatch } from "use-bus"
import { basicMeta2Expr, complexMeta2Expr, removeBasicExpressionMetaFields, removeComplexExpressionMetaFields } from "../utils"


const ruleGroupColumns: ProColumns<RuleCommon>[] = //TableColumnsType<RuleGroup> = 
    [
        {
            title: 'ID',
            dataIndex: 'id',
            hideInForm: true,
        },
        {
            title: '名称',
            dataIndex: 'label',
            ellipsis: true,
            formItemProps: mustFill
        },
        {
            title: '表达式备注',
            dataIndex: 'exprRemark',
            ellipsis: true,
            hideInTable: false,
            hideInSearch: true
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
            fieldProps: { options: [{ value: 0, label: "否" }, { value: 1, label: "是" }] },
            dataIndex: 'exclusive',
            //hideInTable: true,
        },
        {
            title: '状态',
            dataIndex: 'enable',
            valueType: "select",
            //valueEnum: {0: "禁用", 1: "可用"},
            fieldProps: { options: [{ value: 0, label: "禁用" }, { value: 1, label: "可用" }] },
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
            ellipsis: true,
        },
        {
            title: '说明',
            dataIndex: 'description',
            valueType: 'textarea',
            ellipsis: true,
            hideInTable: true,
            hideInSearch: true
        },
        {
            title: '备注',
            dataIndex: 'remark',
            valueType: 'textarea',
            fieldProps: { rows: 6 },
            ellipsis: true,
            hideInTable: true,
            hideInSearch: true
        }
    ]


export const initialValuesRuleGroup: Partial<RuleGroup> = { exclusive: 1, enable: 1, priority: 50, level: 0 }
export const RuleGroupName = "ruleGroup" //typedId以此开头
export const rubleGroupTableProps = {
    ...defaultProps(RuleGroupName), //TODO: 删除一项时从缓存中搜索parent，从而知道是group还是rule中进行删除
    idKey: "typedId",
    //editForm: (e) => '/rule/editRule',
    lastIdFunc: (e: RuleCommon) => e.ruleGroup?.id?.toString() || "",
    transformBeforeSave: (e) => { //props.editConfig.transform, transform(modify shape) before save
        e.tags = e.tagList?.join(",")
        if (e.meta) {
            if (e.meta["metaList"]) {
                e.expr = complexMeta2Expr(e.meta)
                removeComplexExpressionMetaFields(e.meta)
            } else {
                e.expr = basicMeta2Expr(e.meta)
                removeBasicExpressionMetaFields(e.meta)
            }
            e.metaStr = JSON.stringify(e.meta)
            e.exprStr = JSON.stringify(e.expr)
        }
        if (e.remark?.trim() === "") delete e.remark
        if (e.exprRemark?.trim() === "") delete e.exprRemark
        return e
    },
    transformBeforeEdit: (e) => { //props.editConfig.convertValue 
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




export const RuleGroupTable: React.FC = () => {

    const [searchParams] = useSearchParams();
    const initialQuery: RuleGroupQueryParams = { domainId: searchParams["domainId"], level: 0 }
    const [loadingTypeId, setLoadingTypeId] = useState<string>() //loading 
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
                        record.rule ? { label: (<AddParentModal currentRow={record} fromTable={RuleGroupName} key="AddParentModal" />), key: 'AddParentModal' } : null,
                        { label: (<AddChildModal currentRow={record} fromTable={RuleGroupName} key="AddChildModal" />), key: 'AddChildModal' },
                        {
                            label: (<a onClick={() => {
                                if (current.treeData)
                                    setMoveParam({ fromTable: RuleGroupName, list: current.treeData, currentRow: record })
                                else message.warning("no list tree data")
                            }} key="moveNode">移动</a>), key: 'moveNode'
                        },
                        { label: (<a onClick={() => deleteRuleOrGroup(RuleGroupName, record)} key="delete">删除</a>), key: 'delete' },
                    ].filter(e => !!e)
                }}>
                    <a onClick={(e) => e.preventDefault()}> 更多.. </a>
                </Dropdown>,
            ].filter(e => !!e)
        }
    }

    const expandable: ExpandableConfig<RuleCommon> = {
        indentSize: 5,
        expandIcon: ({ expanded, onExpand, record }) => {
            if (loadingTypeId === record.typedId)
                return <Spin size="small" />
            else {
                if (record.children) {
                    return expanded ? (
                        <MinusCircleTwoTone onClick={e => onExpand(record, e)} />
                    ) : (
                        <PlusCircleTwoTone onClick={e => onExpand(record, e)} />
                    )
                } else {
                    return undefined
                }
            }
        },
        onExpand: (expanded, record) => {
            if (expanded && record.children?.length === 0) {
                setLoadingTypeId(record.typedId)
                const name = (record.rule)? RuleName : RuleGroupName
                cachedFetch<RuleCommon[]>({
                    url: `/api/rule/composer/loadChildren/${name}/${record.id}`,
                    method: "GET",
                    isShowLoading: false,
                    onOK: (data) => {
                        setLoadingTypeId(undefined)
                        data.forEach((e) => {
                            e.posPath = [...record.posPath, e.posPath[0]]
                        })
                        record.children = data

                        dispatch("loadChildrenDone-" + rubleGroupTableProps.listApi)
                    },
                    onNoData: () => {
                        setLoadingTypeId(undefined)
                        message.warning("no data return")
                    },
                    onKO: (code, msg) => {
                        setLoadingTypeId(undefined)
                        message.error(code + ": " + msg)
                    },
                    onErr: (errMsg) => {
                        setLoadingTypeId(undefined)
                        message.error("err: "+ errMsg)
                    }
                })
            }
        }
    }

    return <>
        <EasyProTable<RuleCommon, RuleGroupQueryParams>
            {...rubleGroupTableProps}
            expandable={expandable}
            columns={ruleGroupColumns}
            initialQuery={initialQuery}
            initialValues={initialValuesRuleGroup}
            listTransformArgs={path}
            listTransform={(list: RuleCommon[], args?: any) => {
                // ArrayUtil.traverseTree(list, (e) => {
                //     const children = e.children
                //     if (children && children.length > 0)
                //         e.children = children.sort((a, b) => (a.priority || 50) - (b.priority || 50))
                // })
                //list.sort((a, b) => (a.priority || 50) - (b.priority || 50))

                current.treeData = list //记录下当前全部树形数据

                //console.log("after trim, list=",list)

                if (!args) return list
                const root = ArrayUtil.trimTreeByPath(list, args, rubleGroupTableProps.idKey)

                return root ? [root] : list
            }}

            rowKey={ (record) => record.posPath.join('-')  }
            toolBarRender={toolBarRender} actions={actions}
        />
        <MoveIntoNewParentModal param={moveParam} setParam={setMoveParam} />
    </>
}

