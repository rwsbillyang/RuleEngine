
import React from "react"


import { AllDomainKey, Domain, DomainQueryParams, ParamCategory, ParamCategoryQueryParams } from "../DataType"
import { MyProTable } from "@/myPro/MyProTable"
import { ProColumns } from "@ant-design/pro-table"
import { defaultProps, mustFill } from "../moduleTableProps"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { Host } from "@/Config"





export const ParamCategoryTable: React.FC = () => {
  const name = "paramCategory"

  const columns: ProColumns[] = [
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill
    },
    {
      title: '所属',
      key: "domainId",
      dataIndex: ['domain', 'label'],
      //search:{transform:(v)=>{return {domainId: v}}},//转换form字段值的key，默认为dataIndex确定，转换后 将使用 domainId, 选中后值为v
      request: () => asyncSelectProps2Request<Domain, DomainQueryParams>({
        key: AllDomainKey,//与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
        url: `${Host}/api/rule/composer/list/domain`,
        query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
      })
    }
  ]
  
  const props = defaultProps(name) 

  return <MyProTable<ParamCategory, ParamCategoryQueryParams> {...props}  columns={columns}   />
}