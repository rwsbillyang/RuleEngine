
import React from "react"

import { ProColumns } from "@ant-design/pro-table"
import { moduleTableProps } from "../moduleTableProps"
import { RuleAction, RuleActionQueryParams } from "../DataType"
import { MyProTable } from "@/myPro/MyProTable"


export const ActionTable: React.FC = () => {
    const name = "action"
  
    const columns: ProColumns[] = [
      
      {
        title: 'key',
        dataIndex: 'actionKey',
        tooltip: "使用时必须调用RuleEngine注册该key对应的动作",
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
        title: '名称',
        dataIndex: 'label',
        hideInSearch: true
      },
      {
        title: '备注',
        dataIndex: 'remark',
        valueType: 'textarea',
        hideInSearch: true
      }
    ]
  
    const props = moduleTableProps<RuleAction>({title: "动作", name}) 

    return <MyProTable<RuleAction, RuleActionQueryParams> {...props}  columns={columns}   />
  }