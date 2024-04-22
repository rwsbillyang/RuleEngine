
import React from "react"


import { Domain, DomainQueryParams } from "../DataType"
import { EasyProTable } from "easy-antd-pro"
import { ProColumns } from "@ant-design/pro-table"
import { defaultProps, mustFill } from "../moduleTableProps"





export const DomainTable: React.FC = () => {
  const name = "domain"

  const columns: ProColumns<Domain>[] = [
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill,
    }
  ]
  
  const props = defaultProps(name) 

  return <EasyProTable<Domain, DomainQueryParams> {...props}  columns={columns}   />
}