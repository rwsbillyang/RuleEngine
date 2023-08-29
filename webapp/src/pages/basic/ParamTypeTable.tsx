
import React from "react"


import { MyProTable } from "../../myPro/MyProTable"
import { ProColumns } from "@ant-design/pro-table"
import { ParamType, ParamTypeQueryParams } from "../DataType"
import { moduleTableProps } from "../moduleTableProps"



export const ParamTypeTable: React.FC = () => {
  const name = "paramType"

  const initialQuery = { pagination: { pageSize: -1, sKey: "id", sort: 1 } } //pageSize=-1 means all data

  const columns: ProColumns<ParamType>[] = [
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   hideInSearch: true
    // },
    {
      title: '符号',
      dataIndex: 'code',
      hideInSearch: true
    },
    {
      title: '名称',
      dataIndex: 'label',
    },
    {
      title: '支持运算符',
      dataIndex: ['supportOps', 'label'],
      ellipsis: true,
      renderText:(text, record)=> record.supportOps?.map((e)=>e.label).join(", "), 
      hideInSearch: true
    },
    {
      title: '基本类型',
      dataIndex: 'isBasic',
      valueEnum: { false: "否", true: "是" }
    },
    {
      title: '是否内置',
      dataIndex: 'isSys',
      valueEnum: { false: "否", true: "是" }
    },
  ]

  const props = moduleTableProps<ParamType>({
    title: "类型", name, 
    supportDel: false, 
    needLoadMore: false, 
    edit: (e)=> e?.isSys === false ? 'ModalForm': undefined}) 
    
  return <MyProTable<ParamType, ParamTypeQueryParams>  {...props} initialQuery={initialQuery} columns={columns} />
}