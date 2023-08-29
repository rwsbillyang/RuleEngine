
import React from "react"

import { AllDomainKey, Domain, DomainQueryParams,  RuleGroup, RuleGroupQueryParams } from "../DataType"
import { useSearchParams } from "react-router-dom"


import { MyProTable } from "@/myPro/MyProTable"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { ProColumns } from "@ant-design/pro-table"
import { Host } from "@/Config"


import { moduleTableProps } from "../moduleTableProps"


const ruleGroupColumns: ProColumns[] = //TableColumnsType<RuleGroup> = 
    [{
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
        title: '排他性',
        tooltip: "任意一个rule的条件成立则退出",
        dataIndex: 'exclusive',
        valueType: "switch",
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
        dataIndex: 'tagList',
        renderText: (text, row)=> row.tagList?.join(",") ,
    },
    {
        title: '备注',
        dataIndex: 'remark',
        valueType: 'textarea',
        ellipsis: true,
        hideInSearch: true
    }
]



export const rubleTableProps = moduleTableProps<RuleGroup>({
    title: "规则组", name: "ruleGroup",
    //edit: (e) => '/rule/editRule',
    transform: (e) => { //props.editConfig.transform, transform(modify shape) before save
        e.tags = e.tagList?.join(",")
  
        //生成id，同样的条件将是更新
        if (!e.id) {
     
        }

        return e
    },
    convertValue: (e) => { //props.editConfig.convertValue 
        e.tagList = e.tags?.split(",")
        return e
    }
})
const expandable = {
    childrenColumnName: "ruleGroupChildren",
    // expandedRowRender: (record, index, indent, expanded) => {
    //     return <Table columns={ruleGroupColumns} dataSource={record.ruleGroupChildren} pagination={false} />
    // }
}

//基本表达式列表管理
export const RuleGroupTable: React.FC = () => {
    //const name = "ruleGroup"
    const [searchParams] = useSearchParams();
    const initialQuery: RuleGroupQueryParams = { domainId: searchParams["domainId"] }


    return <MyProTable<RuleGroup, RuleGroupQueryParams> {...rubleTableProps} expandable={expandable} columns={ruleGroupColumns} initialQuery={initialQuery}
        initialValues={{ exclusive: true, enable: true, priority: 50}}
    />
}