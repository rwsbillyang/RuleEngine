
import React from "react"

import { AllDomainKey, AllParamTypeKey, Constant, ConstantQueryParams, Domain, DomainQueryParams, Param, ParamCategory, ParamCategoryQueryParams, ParamQueryParams, ParamType, ParamTypeQueryParams } from "../DataType"

import { useSearchParams } from "react-router-dom"
import { Cache } from '@rwsbillyang/usecache'
import { MyProTable } from "@/myPro/MyProTable"
import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { ProColumns } from "@ant-design/pro-table"
import { EnableParamCategory, Host } from "@/Config"
import { getBasicTypeId, typeCode2Id } from "../utils"

import { defaultProps, mustFill } from "../moduleTableProps"


export const ParamTable: React.FC = () => {
  const name = "param"

  const [searchParams] = useSearchParams();
  const initialQuery = { domainId: searchParams["domainId"], typeId: searchParams["typeId"], pagination:{pageSize:20} }

  const columns: ProColumns[] = [
    {
      title: '所属',
      key: "domainId",
      fieldProps: { allowClear: true },
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
      title: '分类',
      key: "categoryId",
      dataIndex: ['paramCategory', 'label'],
      dependencies: ['domainId'], //bugfix 注释掉此行无提示：react-dom.development.js:86 Warning: React does not recognize the `formItemProps` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `formitemprops` instead. If you accidentally passed it from a parent component, remove it from the DOM element.
      fieldProps: { allowClear: true },
      hideInForm: !EnableParamCategory,
      hideInSearch:!EnableParamCategory,
      hideInTable: !EnableParamCategory,
      request: (params) =>  asyncSelectProps2Request<ParamCategory, ParamCategoryQueryParams>({
        key: "paramCategory/domain/" + params.domainId,//与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
        url: `${Host}/api/rule/composer/list/paramCategory`,
        query: { setupChildren:false, domainId: params.domainId, pagination: { pageSize: 10, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
      })
    },
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill
    },
    {
      title: '索引键',
      tooltip: "根据该键，获取对应的变量值，如map的key",
      dataIndex: 'mapKey',
      formItemProps: mustFill
    },
    {
      title: '类型',
      key: "typeId",
      dataIndex: ['paramType', 'label'], //取record中的type中的label展示, 由于QueryParams不支持嵌套对象，因此都需提供search.transform进行搜索项键值转换
      formItemProps: mustFill,
      request: () => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
        key: AllParamTypeKey,//列表页中是全部加载，此处也是全部加载
        url: `${Host}/api/rule/composer/list/paramType`,
        query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
      })
    },   

    {
      title: '值域',
      tooltip: "值来自哪些常量",
      key: 'constantIds',
      dataIndex: ['valueScopes', 'label'],
      renderText: (text, row) => row.valueScopes?.map((e) => e.label)?.join(", "),
      hideInSearch: true,
      fieldProps: { allowClear: true, mode: "multiple" },
      dependencies: ['domainId', 'typeId'], //若选择了枚举，只支持基本类型，否则未全部
      request: (params) => {
        const paramType: ParamType = Cache.findOne(AllParamTypeKey, params.typeId, "id")
        let basicTypeId = getBasicTypeId(params.typeId)
        const setTypeId = paramType? typeCode2Id(paramType.code.replaceAll("Set", "").replaceAll("Enum", "") + "Set") : undefined
        const typeIds = [basicTypeId, setTypeId].filter(e=>!!e).join(",")
        return asyncSelectProps2Request<Constant, ConstantQueryParams>({
          key: "constantEnum/domain/" + params.domainId + "/typeIds/" + typeIds,
          url: `${Host}/api/rule/composer/list/constant`,
          query: { typeIds: typeIds, domainId: params.domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
          convertFunc: (item) => { return { label: item.label, value: item.id } }
        }, params)
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea',
      fieldProps: { allowClear: true },
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

  return <MyProTable<Param, ParamQueryParams> {...props} columns={columns} 
  initialQuery={initialQuery} 
  />
}