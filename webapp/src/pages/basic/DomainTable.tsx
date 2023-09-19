
import React from "react"


import { Domain, DomainQueryParams } from "../DataType"
import { MyProTable } from "@/myPro/MyProTable"
import { ProColumns } from "@ant-design/pro-table"
import { defaultProps, mustFill } from "../moduleTableProps"





export const DomainTable: React.FC = () => {
  const name = "domain"

  const columns: ProColumns[] = [
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill,
    }
  ]
  
  const props = defaultProps(name) 

  return <MyProTable<Domain, DomainQueryParams> {...props}  columns={columns}   />
}