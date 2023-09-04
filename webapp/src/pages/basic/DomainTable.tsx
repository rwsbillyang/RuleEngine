
import React from "react"


import { Domain, DomainQueryParams } from "../DataType"
import { MyProTable } from "@/myPro/MyProTable"
import { ProColumns } from "@ant-design/pro-table"
import { defaultProps } from "../moduleTableProps"





export const DomainTable: React.FC = () => {
  const name = "domain"

  const columns: ProColumns[] = [
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
    }
  ]
  
  const props = defaultProps(name) 

  return <MyProTable<Domain, DomainQueryParams>  myTitle="领域" {...props}  columns={columns}   />
}