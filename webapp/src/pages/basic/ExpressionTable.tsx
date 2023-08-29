
import React from "react"

import { AllDomainKey, BasicExpressionRecord, ComplexExpressionRecord, Domain, DomainQueryParams, ExpressionQueryParams,  basicMeta2Expr } from "../DataType"
import { useLocation, useSearchParams } from "react-router-dom"


import { MyProTable, deleteOne } from "@/myPro/MyProTable"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { ProColumns } from "@ant-design/pro-table"
import { Host } from "@/Config"

import { BaiscExpressionRecordEditor } from "../components/BaiscExpressionRecordEditor"
import { moduleTableProps } from "../moduleTableProps"


const columns: ProColumns[] = [
  {
    title: '名称',
    dataIndex: 'label',
  },
  {
    title: '所属',
    key: "domainId",
    dataIndex: ['domain', 'label'],
    //search:{transform:(v)=>{return {domainId: v}}},//转换form字段值的key，默认为dataIndex确定，转换后 将使用 domainId, 选中后值为v
    request: () => asyncSelectProps2Request<Domain, DomainQueryParams>({
      key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
      url: `${Host}/api/rule/composer/list/domain`,
      query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },
      convertFunc: (item) => { return { label: item.label, value: item.id } }
    })
  },
  {
    title: '类型',
    dataIndex: 'type',
    valueEnum: { "Basic": "基本", "Complex": "复合" }
  },
  {
    title: '备注',
    dataIndex: 'remark',
    valueType: 'textarea',
    ellipsis: true,
    hideInSearch: true
  },
]



//基本表达式列表管理
export const BasicExpressionTable: React.FC = () => {
  const name = "expression"
  const [searchParams] = useSearchParams();
  const initialQuery: ExpressionQueryParams = { domainId: searchParams["domainId"], type: 'Basic' }


  const props = moduleTableProps<BasicExpressionRecord>({title: "基本逻辑表达式", name,
    cacheKey: "basicExpression",
   transform: (e) => { //props.editConfig.transform, transform(modify shape) before save 
      //因BaiscExpressionEditor中paramId和opId值在form中，与上一级与domainId等平齐，但后端保存在meta中，
      //所以保存时放到meta中，同时给meta中的other start等赋值
      //此转换函数再saveOne中执行
      console.log("BasicExpressionTable: to transform...")
      e.metaStr = JSON.stringify(e.meta) 
      e.exprStr = JSON.stringify(basicMeta2Expr(e.meta))
      
      delete e["paramId"]
      delete e["opId"]
      delete e["domain"]
      delete e["meta"]
      delete e["expr"]
      
      return e
    },
   convertValue: (e)=>{ //props.editConfig.convertValue
      //因BaiscExpressionEditor中paramId和opId值在form中，与上一级与domainId等平齐，但后端保存在meta中，
      //所以form编辑时，往上提一级
      //此函数在操作这一栏render "编辑" 按钮时，给BaiscExpressionEditor传初始值时执行
      console.log("BasicExpressionTable: to convert...")
      e.meta = e.metaStr? JSON.parse(e.metaStr) : undefined
      e.expr = e.exprStr? JSON.parse(e.exprStr) : undefined
      e["paramId"] = e.meta?.paramId || e.meta?.param?.id
      e["opId"] = e.meta?.opId || e.meta?.op?.id
      
      return e
    }
})

  //新增和编辑将全部转移到自定义的BaiscExpressionEditor
  const toolBarRender = () => [
    <BaiscExpressionRecordEditor isAdd={true} record={{ type: "Basic" }} tableProps={props} key="addOne"/>
  ]

  //自定义编辑
  const actions: ProColumns<BasicExpressionRecord> = {
    title: '操作',
    valueType: 'option',
    dataIndex: 'actions',
    render: (text, row) => [
      <BaiscExpressionRecordEditor isAdd={false} record={props.editConfig.convertValue? props.editConfig.convertValue(row) : row} tableProps={props} key="editOne"/>,
      <a onClick={() => deleteOne(props, row)} key="delete">删除</a>
    ].filter((e) => !!e)
  }



  return <MyProTable<BasicExpressionRecord, ExpressionQueryParams> {...props} columns={columns} initialQuery={initialQuery}
    toolBarRender={toolBarRender} actions={actions}
  />
}



//复合表达式列表管理
export const ComplexExpressionTable: React.FC = () => {
  const name = "expression"
  const [searchParams] = useSearchParams();
  const initialQuery: ExpressionQueryParams = { domainId: searchParams["domainId"], type: 'Complex' }

 
  const props = moduleTableProps<ComplexExpressionRecord>({title: "复合逻辑表达式", name,
    cacheKey: "complexExpression",
    edit: (e) => "/basic/expression/editComplex"
})

  return <MyProTable<ComplexExpressionRecord, ExpressionQueryParams> {...props} columns={columns} initialQuery={initialQuery} />
}


//TODO
export const ComplexExpressionEditor = () => {
  let { state } = useLocation();
  return <div>TODO： edit {JSON.stringify(state)}</div>
}





