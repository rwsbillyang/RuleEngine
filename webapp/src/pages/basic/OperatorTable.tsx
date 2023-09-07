
import React from "react"


import { MyProTable } from "@/myPro/MyProTable"
import { ProColumns } from "@ant-design/pro-table"
import { Operator, OperatorQueryParams } from "../DataType"
import { defaultProps } from "../moduleTableProps"





export const OperatorTable: React.FC = () => {
  const name = "operator"

  const initialQuery = { pagination: { pageSize: -1, sKey: "id", sort: 1 } } //pageSize=-1 means all data

  const columns: ProColumns[] = [
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
      title: '类型',
      dataIndex: 'type',
      valueType: "select",
      valueEnum:{"Basic": "基本", "Collection":"容器", "Logical":"逻辑运算"}
    },
    {
      title: '备注',
      dataIndex: 'remark',
      hideInSearch: true
    },
  ]

  const props = {
    ...defaultProps(name, false, false),
    needLoadMore: false,
    editForm: (e) => e?.isSys === false ? 'ModalForm' : undefined
  }

  return <MyProTable<Operator, OperatorQueryParams> myTitle="比较符" {...props} initialQuery={initialQuery} columns={columns} />
}