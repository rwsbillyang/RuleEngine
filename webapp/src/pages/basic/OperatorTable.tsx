
import React from "react"


import { MyProTable, MySchemaFormEditor, deleteOne } from "@/myPro/MyProTable"
import { ProColumns } from "@ant-design/pro-table"
import { AllDomainKey, Domain, DomainQueryParams, Operator, OperatorQueryParams } from "../DataType"
import { defaultProps, mustFill } from "../moduleTableProps"
import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import { UseCacheConfig } from "@rwsbillyang/usecache"
import { ProFormColumnsType } from "@ant-design/pro-form"
import { Host } from "@/Config"





export const OperatorTable: React.FC = () => {
  const name = "operator"

  const initialQuery = { pagination: { pageSize: -1, sKey: "id", sort: 1 } } //pageSize=-1 means all data

  //列表字段及内置记录的form编辑 配置
  const sysColumns: ProColumns<Operator>[] = [
    {
      title: '内部代码',
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
      valueEnum: { "Basic": "基本", "Collection": "容器", "Logical": "逻辑运算", 'Cutomize': '自定义' }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea',
      ellipsis: true,
      hideInSearch: true
    },
  ]

  //添加自定义数据时的form字段配置
  const customColumns: ProFormColumnsType<Operator>[] = [
    {
      title: '内部代码',
      dataIndex: 'code',
      fieldProps: { placeholder: "唯一值，推荐用英文字母" },
      formItemProps: mustFill
    },
    {
      title: '名称',
      dataIndex: 'label',
      formItemProps: mustFill
    },
    {
      title: '操作数配置',
      tooltip: '是否拥有该操作数',
      valueType: 'group',
      formItemProps: mustFill,
      columns: [
        {
          title: '某值',
          tooltip: '与某个值比较',
          valueType: 'switch',
          dataIndex: 'other',
        },
        {
          title: '起始值',
          tooltip: '如范围比较时的起始值',
          valueType: 'switch',
          dataIndex: 'start',
        },
        {
          title: '终止值',
          tooltip: '如范围比较时的终止值',
          valueType: 'switch',
          dataIndex: 'end',
        },
        {
          title: '集合容器',
          tooltip: '如是否在某个集合容器中',
          valueType: 'switch',
          dataIndex: 'collection',
        },
        {
          title: '某元素',
          tooltip: '如集合容器是否包含某元素',
          valueType: 'switch',
          dataIndex: 'e',
        },
        {
          title: '交集个数',
          tooltip: '如集合交集元素个数',
          valueType: 'switch',
          dataIndex: 'num',
        },
      ]
    },
    {
      title: '备注',
      dataIndex: 'remark',
      valueType: 'textarea'
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
    }
  ]

  const initialValue: Partial<Operator> = { isSys: false, type: 'Cutomize' }
  const props: MyProTableProps<Operator, OperatorQueryParams> = {
    ...defaultProps(name),
    needLoadMore: false,
    initialValues: initialValue,
    disableDel: (e) => e.isSys,
    //disableEdit: (e) => e.isSys,
    //editForm: (e) => e?.isSys === false ? 'ModalForm' : undefined
  }


  //新增时使用columns，多数字段可编辑
  const toolBarRender = () => [
    <MySchemaFormEditor isAdd={true} columns={customColumns} tableProps={props} style="Button" key="addOne" />
  ]

  //自定义编辑 删除和编辑 针对不同元素不同的配置
  const actions: ProColumns<Operator> = {
    title: '操作',
    valueType: 'option',
    dataIndex: 'actions',
    render: (text, row) => [
      <MySchemaFormEditor columns={row.isSys ? sysColumns : customColumns} isAdd={false} record={props.transformBeforeEdit ? props.transformBeforeEdit(row) : row} tableProps={props} style="Link" key="editOne" />,
      row.isSys ? undefined : <a onClick={() => deleteOne(row, props.delApi + "/" + row[(props.idKey || UseCacheConfig.defaultIdentiyKey || "id")], undefined, props.listApi, props.cacheKey, props.idKey)} key="delete">删除</a>
    ].filter(e => !!e)
  }


  return <MyProTable<Operator, OperatorQueryParams> {...props}
    initialQuery={initialQuery} columns={sysColumns}
    toolBarRender={toolBarRender} actions={actions} />
}