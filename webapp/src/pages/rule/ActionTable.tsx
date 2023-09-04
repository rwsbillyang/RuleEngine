
import React from "react"

import { ProColumns } from "@ant-design/pro-table"

import { RuleAction, RuleActionQueryParams } from "../DataType"
import { MyProTable } from "@/myPro/MyProTable"
import { defaultProps } from "../moduleTableProps"


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
  
    const props = defaultProps(name) 

    return <MyProTable<RuleAction, RuleActionQueryParams> myTitle="动作" {...props}  columns={columns}   />
  }