
import React from "react"


import { MyProTable, MySchemaFormEditor, deleteOne } from "@/myPro/MyProTable"
import { ProColumns } from "@ant-design/pro-table"
import { AllDomainKey, Constant, ConstantQueryParams, Domain, DomainQueryParams, Opcode, OpcodeQueryParams, ParamType, ParamTypeQueryParams, OperandConfig } from "../DataType"
import { defaultProps, mustFill } from "../moduleTableProps"
import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { UseCacheConfig } from "@rwsbillyang/usecache"
import { ProFormColumnsType } from "@ant-design/pro-form"
import { Host } from "@/Config"
import { operandConfigMapStr2List, type2Both } from "../utils"
import { message } from "antd"




export const OpcodeTable: React.FC = () => {
  const name = "opcode"

  const initialQuery = { pagination: { pageSize: -1, sKey: "id", sort: -1 } } //pageSize=-1 means all data

  //列表字段及内置记录的form编辑 配置
  const sysColumns: ProColumns<Opcode>[] = [
    {
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: '操作码',
      dataIndex: 'code',
      readonly: true,
      hideInSearch: true
    },
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill,
    },
    {
      title: '类型',
      dataIndex: 'type',
      valueType: "select",
      hideInForm: true,
      valueEnum: { "Basic": "基本", "Collection": "集合", "Logical": "逻辑运算", 'Ext': '扩展', 'Customize': '自定义' }
    },
    {
      title: '所属',
      key: "domainId",
      fieldProps: { allowClear: true },
      dataIndex: ['domain', 'label'],
      hideInForm: true,
      //search:{transform:(v)=>{return {domainId: v}}},//转换form字段值的key，默认为dataIndex确定，转换后 将使用 domainId, 选中后值为v
      request: () => asyncSelectProps2Request<Domain, DomainQueryParams>({
        key: AllDomainKey,//与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
        url: `${Host}/api/rule/composer/list/domain`,
        query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
      })
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea',
      ellipsis: true,
      hideInSearch: true
    }
  ]

  //添加自定义数据时的form字段配置
  const customColumns: ProFormColumnsType<Opcode>[] = [
    {
      title: '操作码',
      dataIndex: 'code',
      tooltip: "自定义表达式的运算符；一经用于创建规则或表达式，便不可修改",
      fieldProps: { placeholder: "唯一值，推荐用英文字母" },
      formItemProps: mustFill
    },
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill
    },
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
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea'
    },
    {
      title: '操作数列表',
      valueType: 'formList',
      dataIndex: 'operandConfigList',
      columns: [
        {
          valueType: 'group',
          columns: [
            {
              title: '唯一键',
              dataIndex: "name",
              formItemProps: mustFill,
              tooltip: '用于标识获取操作数',
              fieldProps:{placeholder: "唯一键", allowClear: true}
            },
            {
              title: '提示标签',
              dataIndex: "label",
              formItemProps: mustFill,
              fieldProps:{placeholder: "提示标签", allowClear: true},
              tooltip: '提示标签'
            },
            {
              title: '帮助tooltip',
              dataIndex: "tooltip",
              fieldProps:{placeholder: "帮助tooltip", allowClear: true},
              tooltip: '选择输入操作数时给予的提示'
            },
            {
              title: '支持多选',
              dataIndex: "multiple",
              valueType: "switch",
              fieldProps:{placeholder: "支持多选"},
              tooltip: '是否可多选'
            },
            {
              title: '必选项',
              dataIndex: "required",
              valueType: "switch",
              fieldProps:{placeholder: "必选"},
              tooltip: '是否必选'
            },
            {
              title: '值固定选项',
              dataIndex: "selectOptions",
              valueType: "formList",
              tooltip: '操作数值来自固定的选项。与值域、值类型三选一，或均不选（fallback到变量类型）',
              columns:[
                {
                  valueType: 'group',
                  columns: [
                    {
                      title: '选项标签',
                      dataIndex: "label",
                      formItemProps: mustFill,
                      fieldProps:{placeholder: "固定选项标签", allowClear: true},
                      tooltip: '自定义扩展运行库中，根据名称取操作数'
                    },
                    {
                      title: '选项值',
                      dataIndex: "value",
                      formItemProps: mustFill,
                      fieldProps:{placeholder: "固定选项值", allowClear: true},
                      tooltip: '选项值'
                    }
                  ]
                } 
              ]
            },
            {
              title: '值类型',
              dataIndex: "typeCode",
              dependencies: ['typeIsSet'],
              fieldProps:{placeholder: "值类型", allowClear: true},
              tooltip: '不选择，将自动变量类型一致；如当前变量是字符串，操作数却是IntSet集合类型，需额外指定',
              request: (params) => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
                key: "paramType/type/"+params.typeIsSet,//列表页中是全部加载，此处也是全部加载
                url: `${Host}/api/rule/composer/list/paramType`,
                query: { isSys: true, type: params.typeIsSet ? "Collection" : undefined, pagination: { pageSize: -1, sKey: "id", sort: -1 } },//pageSize: -1为全部加载
                convertFunc: (item) => { return { label: item.label, value: item.code } }
              })
            },
            {
              title: '值域',
              dataIndex: "contantIds",
              tooltip: "操作数值来自哪些系统内的常量，与值固定选项、值类型三选一，或均不选（fallback到变量类型）",
              fieldProps: { placeholder: "值域", allowClear: true, mode: "multiple" },
              dependencies: ['typeCode', 'multiple'],
              request: (params) => {
                const typeId = params.otherTypeId
                const typeIds = type2Both(typeId, "paramType/type/"+params.typeIsSet)
                return asyncSelectProps2Request<Constant, ConstantQueryParams>({
                  key: "constant/typeIds/" + typeIds,
                  url: `${Host}/api/rule/composer/list/constant`,
                  query: { typeIds: typeIds, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
                  convertFunc: (item) => { return { label: item.label, value: item.id } }
                }, params)
              }
            }
          ]
        }
      ],
    }
  ]



  //提交保存前数据转换 将各配置字段中的值，保存到operandCfgStr
  const transformBeforeSave = (e: Opcode) => {
    //console.log("transformBeforeSave Constant=", e)
    if (e.isSys) return e

    if (!e.operandConfigList || e.operandConfigList.length === 0) {
      message.warning("没有配置操作数")
      return undefined
    }
    const map = new Map<string, OperandConfig>()
    e.operandConfigList.forEach((e) => {
      e.enable = true
      map[e.name] = e
    })

    e.operandConfigMapStr = JSON.stringify(map)

    return e
  }

  //将operandCfgStr中的值分给各个配置字段
  const transformBeforeEdit = (e?: Partial<Opcode>) => {
    if (!e) return e
    if (e.isSys) return e

    e.operandConfigList = operandConfigMapStr2List(e.operandConfigMapStr)?.list

    return e
  }

  const initialValue: Partial<Opcode> = { isSys: false, type: 'Customize' }
  const props: MyProTableProps<Opcode, OpcodeQueryParams> = {
    ...defaultProps(name),
    needLoadMore: false,
    initialValues: initialValue,
    disableDel: (e) => e.isSys,
    transformBeforeSave,
    transformBeforeEdit
    //disableEdit: (e) => e.isSys,
    //editForm: (e) => e?.isSys === false ? 'ModalForm' : undefined
  }


  //新增时使用columns，多数字段可编辑
  const toolBarRender = () => [
    <MySchemaFormEditor isAdd={true} columns={customColumns} tableProps={props} style="Button" key="addOne" />
  ]

  //自定义编辑 删除和编辑 针对不同元素不同的配置
  const actions: ProColumns<Opcode> = {
    title: '操作',
    valueType: 'option',
    dataIndex: 'actions',
    render: (text, row) => [
      <MySchemaFormEditor columns={row.isSys ? sysColumns : customColumns} isAdd={false} record={props.transformBeforeEdit ? props.transformBeforeEdit(row) : row} tableProps={props} style="Link" key="editOne" />,
      row.isSys ? undefined : <a onClick={() => deleteOne(row, props.delApi + "/" + row[(props.idKey || UseCacheConfig.defaultIdentiyKey || "id")], undefined, props.listApi, props.cacheKey, props.idKey)} key="delete">删除</a>
    ].filter(e => !!e)
  }


  return <MyProTable<Opcode, OpcodeQueryParams> {...props}
    initialQuery={initialQuery} columns={sysColumns}
    toolBarRender={toolBarRender} actions={actions} />
}