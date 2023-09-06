import React from "react"
import { useSearchParams } from "react-router-dom"
import { ProColumns } from "@ant-design/pro-table"
//import locale from 'antd/es/date-picker/locale/zh_CN';
//import locale from "antd/es/date-picker/locale/en_US"

import { MyProTable } from "@/myPro/MyProTable"

import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { Host } from "@/Config"
import { AllDomainKey, AllParamTypeKey, Constant, ConstantQueryParams, Domain, DomainQueryParams, ParamType, ParamTypeQueryParams } from "../DataType"
import { DatePicker, Input, InputNumber, Select, Switch } from "antd"
import {  defaultProps } from "../moduleTableProps"
import { JsonValueEditor } from "../components/JsonValueEditor"




export const ConstantTable: React.FC = () => {
  const name = "constant"

  const [searchParams] = useSearchParams();
  const initialQuery = { domainId: searchParams["domainId"], typeId: searchParams["typeId"] }

  //ProFormColumnsType
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
      title: '值类型',
      hideInSearch: true,
      dependencies: ['isEnum'], //若选择了枚举，只支持基本类型，否则未全部
      key: "typeInfo",
      dataIndex: ['paramType', 'label'], 
      renderText: (text, row)=> row.paramType.label + (row.isEnum? "枚举":"") ,
      //search:{transform:(v)=>{return {typeId: v}}}, ///record中的type中的label展示, 由于QueryParams不支持嵌套对象，因此都需提供search.transform进行搜索项键值转换转换form字段值的key，默认为dataIndex确定，转换后将使用 typeId, 选中后值为v。例如：如果不提供，选择后将如： {type:{label:2}}, 实际需要的是{typeId: 2}。若label也输入了aa，最终form表单值为：{"label":"aa","typeId":2}
      fieldProps: { labelInValue: true },//用于选中得到更多的值
      formItemProps: {
        rules: [
          {
            required: true,
            message: '此项为必填项',
          },
        ],
      },
      
      request: (params) => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
        key: params.isEnum? "enumParamType": AllParamTypeKey,//不提供key，则不缓存
        url: `${Host}/api/rule/composer/list/paramType`,
        //若选择了枚举，只支持基本类型，否则未全部
        query: { isBasic: params.isEnum ? true : undefined, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.code, value: item.id } }
      }, params)
    },
    {
      title: '枚举类型',
      tooltip: "若是枚举，则是固定个数的值",
      dataIndex: 'isEnum',
      hideInTable: true,
      valueType: "switch", //必须使用switch，否则select得到的值是"true"字符串，与后端类型不匹配
      valueEnum:{true: "是" , false: "否"},
      //dependencies: ['typeInfo'], //TODO：若选择Set类型，则清除已有值，并且不可选
      //disable: 
    },
    {
      title: "值", //需要构建一个JsonValue，并且根据枚举以及type选择不同的控件
      dataIndex: "jsonValue", //从后端提供的jsonValue中取值
      dependencies: ['isEnum', 'typeInfo'],
      renderText:(text, record) => record.jsonValue?.value + "",
      renderFormItem: (schema, config, form) => {
        //console.log("schema=" + JSON.stringify(schema))
        //console.log("config=" + JSON.stringify(config))
        
        const isEnum = form.getFieldValue('isEnum')
        const typeInfo = form.getFieldValue('typeInfo')
        const jsonValue = form.getFieldValue('jsonValue')
        
       // console.log("form.isEnum=" + isEnum + ", jsonValue=" + JSON.stringify(jsonValue) +  ", form.getFieldValue('typeInfo')=" + JSON.stringify(typeInfo))

        return <JsonValueEditor type={typeInfo?.label} width="100%" multiple={isEnum || typeInfo?.label?.indexOf("Set") > 0} value={jsonValue}/>
      },
      formItemProps: {
        rules: [
          {
            required: true,
            message: '此项为必填项',
          },
        ],
      },
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

  //提交保存前数据转换
  const transformBeforeSave = (e: Constant) => {
    //console.log("transformBeforeSave Constant=",e)
    if (e.typeInfo){
       e.jsonValue = { _class: e.typeInfo.label + (e.isEnum? "Set": ""), value: e.jsonValue?.value }//若选择枚举，则存储类型为容器。故_class加上Set
       e.typeId = +e.typeInfo.value
       delete e.typeInfo
       
       
       e.value = JSON.stringify(e.jsonValue)
    }
    delete e.paramType
    delete e.domain

    return e
  }

  //bugfix: 值类型在编辑时不能回显，即使提供了typeInfo，因为后面的值编辑控件需要得到ParamType.code，故将值类型设置了：fieldProps: { labelInValue: true }
  const transformBeforeEdit = (e?: Partial<Constant>) => {
    if(e?.paramType)
      e.typeInfo = {label: e.paramType.code, value: e.paramType.id || ""}
    return e
  }

  const props : MyProTableProps<Constant, ConstantQueryParams> = {...defaultProps(name), transformBeforeSave, transformBeforeEdit } 
  
  return <MyProTable<Constant, ConstantQueryParams> {...props} myTitle="常量" columns={columns} initialValues={{ isEnum: false }} initialQuery={initialQuery} />
}

