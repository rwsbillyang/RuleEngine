import React from "react"
import { useSearchParams } from "react-router-dom"

//import locale from 'antd/es/date-picker/locale/zh_CN';
//import locale from "antd/es/date-picker/locale/en_US"

import { MyProTable } from "@/myPro/MyProTable"

import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { Host } from "@/Config"
import { AllDomainKey, AllParamTypeKey, Constant, ConstantQueryParams, Domain, DomainQueryParams, ParamType, ParamTypeQueryParams } from "../DataType"
import { defaultProps, mustFill } from "../moduleTableProps"
import { ProFormColumnsType } from "@ant-design/pro-form"
import { ProColumns } from "@ant-design/pro-table"
import { LabeledValue } from "antd/lib/select"
import { JsonValueEditor } from "../components/JsonValueEditor"




export const ConstantTable: React.FC = () => {
  const name = "constant"

  const [searchParams] = useSearchParams();
  const initialQuery = { domainId: searchParams["domainId"], typeId: searchParams["typeId"] }


  const columns: ProColumns[] = [
    {
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill,
    },
    {
      title: '是否枚举',
      tooltip: "枚举值只能是基本类型，值可以有个名称",
      dataIndex: 'isEnum',
      hideInTable: true,
      valueType: "switch", //必须使用switch，否则select得到的值是"true"字符串，与后端类型不匹配
      valueEnum: { true: "是", false: "否" },
    },
    {
      title: '值类型',
      hideInSearch: true,
      dependencies: ['isEnum'],
      key: "typeInfo",
      dataIndex: ['paramType', 'label'],
      renderText: (text, row) => row.paramType?.label + (row.isEnum ? "枚举" : ""),
      fieldProps: { labelInValue: true },//用于选中得到更多的值
      request: (params) => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
        key: params.isEnum ? "enumParamType" : AllParamTypeKey,//不提供key，则不缓存
        url: `${Host}/api/rule/composer/list/paramType`,
        //若选择了枚举，只支持基本类型，否则为全部
        query: { type: params.isEnum ? 'Basic' : undefined, pagination: { pageSize: -1, sKey: "id", sort: -1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.code, value: item.id } }
      }, params)
    },
    {
      title: "值", //需要构建一个JsonValue，并且根据枚举以及type选择不同的控件
      dataIndex: "jsonValue", //从后端提供的jsonValue中取值
      renderText: (text, record) => {
        if (record.isEnum)
          return record.jsonValue?.value?.map(e => e.label).join(",")
        else if (record.jsonValue?._class.indexOf("Set") > 0)
          return record.jsonValue?.value?.join(",")
        else
          return record.jsonValue?.value + ""
      },
      // dependencies: ['isEnum', 'typeInfo'], 
      // renderFormItem: (schema, config, form) => {
      //   //console.log("schema=" + JSON.stringify(schema))
      //   //console.log("config=" + JSON.stringify(config))

      //   const isEnum = form.getFieldValue('isEnum')
      //   const typeInfo = form.getFieldValue('typeInfo')
      //   const jsonValue = form.getFieldValue('jsonValue')

      //  // console.log("form.isEnum=" + isEnum + ", jsonValue=" + JSON.stringify(jsonValue) +  ", form.getFieldValue('typeInfo')=" + JSON.stringify(typeInfo))
      //   const multiple = isEnum || typeInfo?.label?.indexOf("Set") > 0


      //   return <JsonValueEditor type={typeInfo?.label} width="100%" multiple={multiple} value={jsonValue}/>
      // },
      ellipsis: true,
      hideInSearch: true
    },
    {
      title: '所属',
      key: "domainId",
      dataIndex: ['domain', 'label'],
      //search:{transform:(v)=>{return {domainId: v}}},//转换form字段值的key，默认为dataIndex确定，转换后 将使用 domainId, 选中后值为v
      request: (params) => asyncSelectProps2Request<Domain, DomainQueryParams>({
        key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
        url: `${Host}/api/rule/composer/list/domain`,
        query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
      }, params)
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea',
      ellipsis: true,
      hideInSearch: true
    }
  ]


  const formColumns: ProFormColumnsType<Constant>[] = [
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill,
    },
    {
      title: '是否枚举',
      tooltip: "枚举值只能是基本类型，值可以有个名称",
      dataIndex: 'isEnum',
      hideInTable: true,
      valueType: "switch", //必须使用switch，否则select得到的值是"true"字符串，与后端类型不匹配
      valueEnum: { true: "是", false: "否" },
    },
    {
      title: '值类型',
      key: "typeInfo",
      dataIndex: ['paramType', 'label'],
      hideInSearch: true,
      fieldProps: { labelInValue: true },//用于选中得到更多的值
      formItemProps: mustFill,
      dependencies: ['isEnum'],
      request: (params) => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
        key: params.isEnum ? "enumParamType" : AllParamTypeKey,//不提供key，则不缓存
        url: `${Host}/api/rule/composer/list/paramType`,
        //若选择了枚举，只支持基本类型，否则为全部
        query: { type: params.isEnum ? 'Basic' : undefined, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.code, value: item.id } }
      }, params)
    },
    {
      valueType: 'dependency',
      name: ['isEnum', 'typeInfo'],
      columns: ({ isEnum, typeInfo }) => getJsonValueColumn(isEnum, typeInfo),
    },
    {
      title: '所属',
      key: "domainId",
      dataIndex: ['domain', 'label'],
      request: (params) => asyncSelectProps2Request<Domain, DomainQueryParams>({
        key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
        url: `${Host}/api/rule/composer/list/domain`,
        query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
      }, params)
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea'
    }
  ]


  //提交保存前数据转换
  const transformBeforeSave = (e: Constant) => {
    console.log("transformBeforeSave Constant=", e)
    if (e.typeInfo) {
      e.jsonValue = { _class: e.typeInfo.label + (e.isEnum ? "Enum" : ""), value: e.jsonValue?.value }//若选择枚举，则存储类型为容器。故_class加上Set
      e.typeId = +e.typeInfo.value
      delete e.typeInfo

      // if (e.jsonValue?.value && Array.isArray(e.jsonValue?.value)) {
      //   e.jsonValue?.value.forEach(e => {
      //     delete e["0"]//为何数组元素中存在一个0的字段？
      //     delete e["1"] //应该是旧格式修改时被antd自动添加上的，新建的记录无这些字段
      //   })
      // }


      e.value = JSON.stringify(e.jsonValue)
    }

    delete e.paramType
    delete e.domain
    delete e.jsonValue

    return e
  }

  //bugfix: 值类型在编辑时不能回显，即使提供了typeInfo，因为后面的值编辑控件需要得到ParamType.code，故将值类型设置了：fieldProps: { labelInValue: true }
  const transformBeforeEdit = (e?: Partial<Constant>) => {
    if (e?.paramType)
      e.typeInfo = { label: e.paramType.code, value: e.paramType.id || "" }

    if (e?.value) {
      e.jsonValue = JSON.parse(e.value)
    }
    return e
  }

  const props: MyProTableProps<Constant, ConstantQueryParams> = { ...defaultProps(name), transformBeforeSave, transformBeforeEdit }

  return <MyProTable<Constant, ConstantQueryParams> {...props} columns={columns} formColumns={formColumns} initialValues={{ isEnum: false }} initialQuery={initialQuery} />
}


const getJsonValueColumn = (isEnum?: boolean, typeInfo?: LabeledValue) => {
  const type = typeInfo?.label as string
  //https://pro-components.antdigital.dev/components/schema#valuetype-%E5%88%97%E8%A1%A8
  let vauleType: "text" | "switch" | "dateTime" | "digit" = "text"
  let props = {}
  if (type) {
    if (type.indexOf('Bool') >= 0) {
      vauleType = "switch"
    } else if (type.indexOf('DateTime') >= 0) {
      vauleType = "dateTime"
    } else if (type.indexOf('Int') >= 0) {
      vauleType = "digit"
      props = {  precision: 0, min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER} 
    }else if(type.indexOf('Long') >= 0){
      vauleType = "digit"
      props = { precision: 0, min: Number.MIN_VALUE, max: Number.MAX_VALUE} 
    }else if(type.indexOf('Double') >= 0){
      vauleType = "digit"
      props = { precision: 7 } 
    }
  }

  

 // console.log("vauleType=" + vauleType) //+ ",typeInfo",typeInfo)

  let columns: ProFormColumnsType[]
  if (isEnum) {
    columns = [
      {
        title: '枚举值',
        tooltip: "若是枚举，则是固定个数的值",
        valueType: 'formList',
        dataIndex: ['jsonValue', 'value'],
        formItemProps: mustFill,
        renderText: (text, record) => record.jsonValue?.value?.map(e => e.label).join(","),
        columns: [
          {
            valueType: 'group',
            columns: [
              {
                title: '名称',
                dataIndex: 'label',
                width: 'sm',
              },
              {
                title: '值',
                fieldProps: props,
                valueType:vauleType,
                dataIndex: 'value',
                width: 'sm',
                formItemProps: mustFill,
              },
            ],
          },
        ],
      },
    ]
  } else if (type && type.indexOf("Set") > 0) {
    columns = [
      {
        title: "集合值", //需要构建一个JsonValue，并且根据枚举以及type选择不同的控件
        dataIndex: 'jsonValue',//从后端提供的jsonValue中取值
        valueType: vauleType,
        width: 'md',
        renderText: (text, record) => record.jsonValue?.value + "",
        renderFormItem: (schema, config, form) => {
          //console.log("schema=" + JSON.stringify(schema))
          //console.log("config=" + JSON.stringify(config))
          const jsonValue = form.getFieldValue('jsonValue')
          return <JsonValueEditor type={type} width="100%" multiple={true} value={jsonValue} />
        },
        formItemProps: mustFill,
        hideInSearch: true
      }//针对集合，上面的结构输入更方便，直接逗号隔开输入全部值，存储时也较简洁，缺点是不支持不同类型的值不同UI控件
      //而下面注释掉的采用列表添加一行来输入，输入较为不便，但支持各种数据类型输入，且数据存储结构与枚举相同
      // {
      //   title: '集合值',
      //   formItemProps: mustFill,
      //   valueType: 'formList',
      //   dataIndex: ['jsonValue', 'value'],
      //   renderText: (text, record) => record.jsonValue?.value?.join(","),
      //   hideInSearch: true,
      //   columns: [
      //     {
      //       dataIndex: 'value',
      //       valueType: vauleType,
      //       width: 'md',
      //       formItemProps: mustFill,
      //       hideInSearch: true,
      //     },
      //   ],
      // },
    ]

  } else {
    columns = [
      {
        title: "值", //需要构建一个JsonValue，并且根据枚举以及type选择不同的控件
        dataIndex: ['jsonValue', 'value'],//从后端提供的jsonValue中取值
        valueType: vauleType,
        width: 'md',
        renderText: (text, record) => record.jsonValue?.value + "",
        formItemProps: mustFill,
        hideInSearch: true
      }
    ]
  }
  console.log("columns", columns)
  return columns
}