
import React from "react"


import { AllDomainKey, Domain, DomainQueryParams, ParamCategory, ParamCategoryQueryParams } from "../DataType"
import { ProColumns } from "@ant-design/pro-table"
import { defaultProps, mustFill } from "../moduleTableProps"
import { EasyProTable, asyncSelectProps2Request } from "easy-antd-pro"
import { Host } from "@/Config"





export const ParamCategoryTable: React.FC = () => {
  const name = "paramCategory"

  const columns: ProColumns[] = [
    {
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
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
    },
    {
      title: '附属信息',
      tooltip: "通常用于添加分类信息，传递给其下面的变量，然后最终传递给基本表达式，用于协助mapKey区分是哪个分类下的变量",
      dataIndex: 'extra'
    },
  ]
  
  const props = defaultProps(name) 

  return <EasyProTable<ParamCategory, ParamCategoryQueryParams> {...props}  columns={columns}   />
}