
import React from "react"


import { MyProTable, MySchemaFormEditor, deleteOne } from "../../myPro/MyProTable"
import { ProColumns } from "@ant-design/pro-table"
import { AllDomainKey, Domain, DomainQueryParams, Opcode, OpcodeQueryParams, ParamType, ParamTypeQueryParams } from "../DataType"
import { defaultProps, mustFill } from "../moduleTableProps"
import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { UseCacheConfig } from "@rwsbillyang/usecache"
import { Host } from "@/Config"




export const ParamTypeTable: React.FC = () => {
  const name = "paramType"

  const initialQuery = { pagination: { pageSize: -1, sKey: "id", sort: -1 } } //pageSize=-1 means all data

  //列表字段及内置记录的form编辑 配置
  const sysColumns: ProColumns<ParamType>[] = [
    {
      title: '类型码',
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
      title: '支持运算符',
      dataIndex: ['supportOps', 'label'],
      ellipsis: true,
      hideInForm: true,
      renderText: (text, record) => record.supportOps?.map((e) => e.label).join(", "),
      hideInSearch: true
    },
    // {
    //   title: '基本类型',
    //   dataIndex: 'isBasic',
    //   hideInForm: true,
    //   valueType: "select",
    //   valueEnum: { false: "否", true: "是" }
    // },
    // {
    //   title: '是否内置',
    //   dataIndex: 'isSys',
    //   hideInForm: true,
    //   valueType: "select",
    //   valueEnum: { false: "否", true: "是" }
    // },
  ]

  //添加自定义数据时的form字段配置
  const customColumns: ProColumns<ParamType>[] = [
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
      title: '类型码',
      dataIndex: 'code',
      tooltip: "须与扩展库SerialName一致；一经用于创建规则或表达式，便不可修改",
      hideInSearch: true,
      formItemProps: mustFill,
      fieldProps: { placeholder: "唯一值，推荐用英文字母" }
    },
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill,
    },
    {
      title: '支持运算符',
      tooltip: '需先创建比较符，再进行多选',
      dataIndex: 'opsIdList',
      fieldProps: { mode: 'multiple' },
      dependencies: ['domainId'],
      formItemProps: mustFill,
      request: (params) => asyncSelectProps2Request<Opcode, OpcodeQueryParams>({
        key: "op/domain/" + params.domainId,
        url: `${Host}/api/rule/composer/list/opcode`,
        query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
      })
    },
  ]


  //提交保存前数据转换
  const transformBeforeSave = (e: ParamType) => {
    //console.log("transformBeforeSave Constant=", e)
    if (e["opsIdList"]) {
      e.supportOpIds = e["opsIdList"].join(',')
    }

    return e
  }

  //bugfix: 值类型在编辑时不能回显，即使提供了typeInfo，因为后面的值编辑控件需要得到ParamType.code，故将值类型设置了：fieldProps: { labelInValue: true }
  const transformBeforeEdit = (e?: Partial<ParamType>) => {
    if (!e) return e
    if (e.supportOpIds) {
      e["opsIdList"] = e.supportOpIds.split(',').map((e) => +e)
    }
    return e
  }

  const initialValue: Partial<ParamType> = { type: 'Customize', isSys: false }
  const props: MyProTableProps<ParamType, ParamTypeQueryParams> = {
    ...defaultProps(name),
    initialValues: initialValue,
    transformBeforeSave,
    transformBeforeEdit,
    needLoadMore: false,
    disableDel: (e) => e.isSys,
    // disableEdit: (e) => e.isSys,
  }


  //新增时使用columns，多数字段可编辑
  const toolBarRender = () => [
    <MySchemaFormEditor isAdd={true} columns={customColumns}  tableProps={props} style="Button" key="addOne" />
  ]

  //自定义编辑 删除和编辑 针对不同元素不同的配置
  const actions: ProColumns<ParamType> = {
    title: '操作',
    valueType: 'option',
    dataIndex: 'actions',
    render: (text, row) => [
      <MySchemaFormEditor columns={row.isSys ? sysColumns : customColumns} isAdd={false} record={props.transformBeforeEdit ? props.transformBeforeEdit(row) : row} tableProps={props} style="Link" key="editOne" />,
      row.isSys ? undefined : <a onClick={() => deleteOne(row, props.delApi + "/" + row[(props.idKey || UseCacheConfig.defaultIdentiyKey || "id")], undefined, props.listApi, props.cacheKey, props.idKey)} key="delete">删除</a>
    ].filter(e => !!e)
  }

  return <MyProTable<ParamType, ParamTypeQueryParams> {...props}
    initialQuery={initialQuery}
    columns={sysColumns}
    toolBarRender={toolBarRender} actions={actions} />
}