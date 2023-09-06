
import React from "react"

import { AllDomainKey, AllParamTypeKey, Constant, ConstantQueryParams, Domain, DomainQueryParams, Param, ParamQueryParams, ParamType, ParamTypeQueryParams } from "../DataType"

import { useSearchParams } from "react-router-dom"

import { MyProTable } from "@/myPro/MyProTable"
import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { ProColumns } from "@ant-design/pro-table"
import { Host } from "@/Config"
import { getBasicTypeId } from "../utils"

import { defaultProps } from "../moduleTableProps"


export const ParamTable: React.FC = () => {
  const name = "param"

  const [searchParams] = useSearchParams();
  const initialQuery = { domainId: searchParams["domainId"], typeId: searchParams["typeId"] }

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
    },
    {
      title: '索引键',
      dataIndex: 'mapKey',
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
      title: '类型',
      key: "typeId",
      dataIndex: ['paramType', 'label'], //取record中的type中的label展示, 由于QueryParams不支持嵌套对象，因此都需提供search.transform进行搜索项键值转换
      //search:{transform:(v)=>{return {typeId: v}}}, //转换form字段值的key，默认为dataIndex确定，转换后将使用 typeId, 选中后值为v。例如：如果不提供，选择后将如： {type:{label:2}}, 实际需要的是{typeId: 2}。若label也输入了aa，最终form表单值为：{"label":"aa","typeId":2}
      formItemProps: {
        rules: [
          {
            required: true,
            message: '此项为必填项',
          },
        ],
      },
      request: () => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
        key: AllParamTypeKey,//列表页中是全部加载，此处也是全部加载
        url: `${Host}/api/rule/composer/list/paramType`,
        query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.code, value: item.id } }
      })
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
      title: '值域',
      tooltip: "值只能来自对应的枚举类型",
      key: 'constantIds',
      dataIndex: ['valueScopes', 'label'],
      renderText: (text, row) => row.valueScopes?.map((e) => e.label)?.join(", "),
      hideInSearch: true,
      fieldProps: { allowClear: true, mode: "multiple" },
      dependencies: ['domainId', 'typeId'], //若选择了枚举，只支持基本类型，否则未全部
      request: (params) => {
        let basicTypeId = getBasicTypeId(params.typeId)
        
        return asyncSelectProps2Request<Constant, ConstantQueryParams>({
          key: "constantEnum/domain/" + params.domainId + "/basicType/" + basicTypeId,
          url: `${Host}/api/rule/composer/list/constant`,
          query: { isEnum: true, typeIds: [basicTypeId].join(","), domainId: params.domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
          convertFunc: (item) => { return { label: item.label, value: item.id } }
        }, params)
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea',
      ellipsis: true,
      hideInSearch: true
    }
  ]
  //提交保存前数据转换
  const transformBeforeSave = (e: Param) => {
    if (e.constantIds && e.constantIds.length > 0) {
      e.valueScopeIds = e.constantIds.join(",")
      e.constantIds = undefined
    } else {
      e.valueScopeIds = undefined
      e.valueScopes = undefined
    }

    return e
  }
  //编辑前转换
  const transformBeforeEdit = (e?: Partial<Param>) => {
    if(!e) return e
    if (e.valueScopeIds)
      e.constantIds = e.valueScopeIds.split(",").map((e) => +e)
    return e
  }


    const props: MyProTableProps<Param, ParamQueryParams> = {
      ...defaultProps(name),
      transformBeforeSave,
      transformBeforeEdit
    }

  return <MyProTable<Param, ParamQueryParams> myTitle="变量" {...props} columns={columns} initialQuery={initialQuery} />
}