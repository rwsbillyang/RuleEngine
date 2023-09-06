import React, { useEffect, useRef, useState } from 'react';
import { Button, Dropdown, Form, MenuProps, Tooltip, Transfer } from 'antd';
import type { TransferDirection, TransferListProps } from 'antd/es/transfer';
import { cachedGet, Cache } from "@rwsbillyang/usecache"
import { AllDomainKey, BasicExpressionMeta, BasicExpressionRecord, ComplexExpressionMeta, ComplexExpressionRecord, Domain, DomainQueryParams, ExpressionQueryParams, Operator, OperatorQueryParams} from '../DataType';
import { ConditionEditor } from './ConditionEditor';
import { Host } from '@/Config';
import { ModalForm, ProFormDependency, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-form';
import { MyProTableProps, asyncSelectProps2Request } from '@/myPro/MyProTableProps';
import { saveOne } from '@/myPro/MyProTable';
import { basicExpressionMeta2String, complexExpressionMeta2String, meta2Expr, sortedConcat } from '../utils';
import md5 from "md5"

/**
 * 根据id数组，从数组中获取对应的全部元素
 * @param array 
 * @param ids 
 * @param idKey 
 * @returns 
 */
function getByIds<T>(array: T[], ids?: string[] | number[], idKey: string = "id") {
  if (!array || array.length === 0 || !ids || ids.length === 0) return undefined
  const ret: T[] = []
  for (let i = 0; i < array.length; i++) {
    inner: for (let j = 0; j < ids.length; j++) {
      if (array[i][idKey] === ids[j]) {
        ret.push(array[i])
        break inner
      }
    }
  }
  return ret
}
/**
 * 从复合表达式中拆解出各基本表达式，并给它们添加上key
 * @param meta 
 */
function destructComplexExpressionMeta(metaList?: (BasicExpressionMeta | ComplexExpressionMeta)[], result?: (BasicExpressionMeta | ComplexExpressionMeta)[]) {
  const list = result || []
  if (!metaList) return list

  metaList.forEach((e) => {
    e.key = md5(sortedConcat(meta2Expr(e))) //list.length + ""
    list.push(e)
    if (e["metaList"]) {
      destructComplexExpressionMeta(e["metaList"], list)
    }
  })

  return list
}
function getTargetKeysByMeta(metaList?: (BasicExpressionMeta | ComplexExpressionMeta)[]) {
  const list: string[] = []
  if (!metaList) return list

  metaList.forEach((e, i) => {
    list.push(md5(sortedConcat(meta2Expr(e))))//list.push(i + "")
  })

  return list
}

/**
 * 逻辑表达式操作符选择下拉DropDwon
 * @param title 展示的名称
 * @param disabled 是否激活，当表达式列表为空时，应为true
 * @param onClick 点击选中哪个操作符
 * @returns 
 */
const LogicalExprDropDwon: React.FC<{ title?: string, disabled?: boolean, onClick: (e: Operator) => void }> = ({ title, disabled, onClick }) => {
  const [ops, setOps] = useState<Operator[]>([])
  useEffect(() => {
    cachedGet<Operator[]>(`${Host}/api/rule/composer/list/operator`, (data) => setOps(data),
      { type: 'Logical', pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载)
      "ops/Logical")
  }, [])

  const onClick2: MenuProps['onClick'] = ({ key }) => {
    const e = Cache.findOneInArray(ops, key, "code")
    if(e) onClick(e)
    else console.log("clicked key=" + key + ", but not found in ops=",ops)
  };

  // return <Select disabled={disabled} options={ops?.map((e) => ({
  //   label:  e.label,
  //   value: e.code
  // }))}/>

  // return <Dropdown disabled={disabled} menu={{
  //   items: ops?.map((e) => ({
  //     label: e.label,
  //     key: e.code,
  //   })), onClick: onClick2
  // }} placement="top">
  //   <Button>{title}</Button>
  // </Dropdown>

  return <Dropdown.Button
      menu={{
        items: ops?.map((e) => ({
          label: e.label,
          key: e.code,
        })), onClick: onClick2
      }}
      buttonsRender={([leftButton, rightButton]) => [
        <Tooltip title="已选表达式经过哪种逻辑运算，添加到左侧候选表" key="leftButton">
          {leftButton}
        </Tooltip>,
        React.cloneElement(rightButton as React.ReactElement<any, string>),
      ]}
    >
      {title}
    </Dropdown.Button>
}



/**
 *  (BasicExpressionMeta | ComplexExpressionMeta)[] 列表编辑器
 * 一个Transfer，左侧显示当前可供选择的表达式，可将左侧表达式添加到右侧
 * 左侧底部按钮用于创建一个新的基本表达式，作为源
 * 右侧底部按钮用于当前列表中的表达式用逻辑操作符连接起来，并继续添加到左侧，构造一个复合表达式，作为源
 * 
 * Transfer的底部按钮，用于将右侧列表中的表达式连接起来，构造一个复合表达式，作为结果返回
 * 
 * @param domainId 
 * @returns 
 */
export const MetaListTransfer: React.FC<{
  domainId?: number,
  value?: (BasicExpressionMeta | ComplexExpressionMeta)[],
  onChange: (list?: (BasicExpressionMeta | ComplexExpressionMeta)[]) => void
}> = ({ domainId, value, onChange }) => {
  const [targetKeys, setTargetKeys] = useState<string[]>(getTargetKeysByMeta(value));
  const [metaList, setMetaList] = useState<(BasicExpressionMeta | ComplexExpressionMeta)[]>(destructComplexExpressionMeta(value));
  

  //加载domainId下额所有表达式
  useEffect(() => {
    cachedGet<(BasicExpressionRecord | ComplexExpressionRecord)[]>(`${Host}/api/rule/composer/list/expression`, (data) => {
      data.forEach((e) => {
        //if(e.exprStr) e["expr"] = JSON.parse(e.exprStr)
        if (e.metaStr) {
          const meta: BasicExpressionMeta | ComplexExpressionMeta = JSON.parse(e.metaStr)
          meta.key = md5(sortedConcat(meta2Expr(meta))) //e.id + "" //设置key，用记录的id
          metaList.push(meta)
        }
      })
      setMetaList([...metaList])
    },
      { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载)
      "expression/domain/" + domainId)
  }, [])


  const renderFooter = (props: TransferListProps<BasicExpressionMeta | ComplexExpressionMeta>, info?: {
    direction: TransferDirection;
  }) => {
    if (!info || info?.direction === 'left') {
      return (
        <ConditionEditor onlyCreatNew={true} triggerName="新增基本表达式" title="编辑基本表达式" domainId={domainId} onDone={(condition) => {
          console.log(condition)
          const meta = condition.meta
          meta["key"] = md5(sortedConcat(meta2Expr(meta))) //Date.now() + "" //设置key，用记录的id, Date.now() 方法返回自 1970 年 1 月 1 日 00:00:00 (UTC) 到当前时间的毫秒数。
          metaList.push(meta)
          setMetaList([...metaList])
        }} />
      );
    } else
      return (
        <LogicalExprDropDwon disabled={targetKeys.length < 2} title="添加到左侧" onClick={(op) => {
          const list = getByIds(metaList, targetKeys, "key")
          if (list?.length === targetKeys.length) {
            const meta: ComplexExpressionMeta = {
              _class: "Complex",
              op: op,
              opId: op.id,
              metaList: list,
            }
            meta.key = md5(sortedConcat(meta2Expr(meta))) //Date.now() + "" //设置key，用记录的id, Date.now() 方法返回自 1970 年 1 月 1 日 00:00:00 (UTC) 到当前时间的毫秒数。

            metaList.push(meta)
            setMetaList([...metaList])
            setTargetKeys([])

            console.log("successful to add one complexExpressionMeta to left")
          } else {
            console.warn("fail to get metaList from targetKeys=", targetKeys)
          }

        }} />
      );
  };


  return <Transfer
    dataSource={metaList}
    titles={['候选表达式', '已选表达式']}
    listStyle={{
      width: "100%",
      height: 300,
    }}
    targetKeys={targetKeys}
    onChange={(newTargetKeys: string[]) => {
      setTargetKeys(newTargetKeys);

      const list = getByIds(metaList, newTargetKeys, "key")
      onChange(list)// TODO： 改为按钮响应，而不是每次修改后执行
     
      console.log("onChange:",list)
    }}
    render={(item) => {
      if (item._class === "Complex") {
        return complexExpressionMeta2String(item as ComplexExpressionMeta)
      } else {
        return basicExpressionMeta2String(item)
      }
    }}
    footer={renderFooter}
  />
}


/**
 *  ComplexExpressionMeta Modal对话框编辑器
 * 
 * 包含了隐藏的_class字段、逻辑运算符选择，
 * 以及一个 (BasicExpressionMeta | ComplexExpressionMeta) 列表编辑器
 * 共同构成一个对话框，点击对话框后，父组件通过提供的onDone获取到ComplexExpressionMeta的值
 * 
 * @param domainId 
 * @returns 
 */
export const ComplexExpressionMetaEditorModal: React.FC<{
  domainId?: number,
  value?: ComplexExpressionMeta,
  onDone: (value?: ComplexExpressionMeta) => void
}> = ({ domainId, value, onDone }) => {

  const { current } = useRef({ metaList: value?.metaList })

  return <ModalForm
    layout="horizontal"
    title={"编辑复合表达式"}
    trigger={<a >编辑</a>}
    autoFocusFirstInput
    modalProps={{
      destroyOnClose: false,
    }}
    submitTimeout={2000}
    onFinish={async (values) => {      
      values.metaList = current.metaList
      values.op = Cache.findOne("op/Logical", values.opId, "id")

      console.log("ComplexExpressionMetaEditorModal: ModalForm.onFinish: values=", values);

      onDone(values)
      return true
    }} >
    <ProFormText hidden name="_class" initialValue="Complex" />


    <Form.Item label="表达式列表" required rules={[{ required: true, message: '必选' }]}>
      <MetaListTransfer domainId={domainId} value={value?.metaList} onChange={(list) => { current.metaList = list }} />
    </Form.Item>

    <ProFormSelect
      name="opId"
      initialValue={value?.opId}
      tooltip="已选表达式以何种方式进行逻辑运算"
      label="逻辑运算符"
      rules={[{ required: true, message: '必选' }]}

      request={(params) => asyncSelectProps2Request<Operator, OperatorQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
        key: "op/Logical",//不提供key，则不缓存，每次均从远程请求
        url: `${Host}/api/rule/composer/list/operator`,
        query: { type: "Logical", pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => {
          return { label: item.label + "(" + item.code + ")", value: item.id }
        }
      })}
    />
  </ModalForm>
}

/**
 * ComplexExpressionRecord 复合表达式数据库记录 对话框编辑器
 * @param isAdd 
 * @param record 
 * @param tableProps 
 * @returns 
 */
export const ComplexExpressionRecordEditor: React.FC<{
  isAdd: boolean,
  record?: Partial<ComplexExpressionRecord>,
  tableProps: MyProTableProps<ComplexExpressionRecord, ExpressionQueryParams>
}> = ({ isAdd, record, tableProps }) => {
 // let { state } = useLocation();
  
 const [meta, setMeta] = useState(record?.meta)

  //console.log("ComplexExpressionRecordEditor, record=", record)


  return <ModalForm<ComplexExpressionRecord> initialValues={record} layout="horizontal"
    title="复合逻辑表达式"
    trigger={isAdd ? <Button type="primary">新建</Button> : <a key="editLink">编辑</a>}
    autoFocusFirstInput
    modalProps={{
      destroyOnClose: false,
      //onCancel: () => console.log('run'),
    }}
    submitTimeout={2000}
    onFinish={async (values) => {
      console.log("ComplexExpressionRecordEditor: ModalForm.onFinish: values=", values);
      values.meta = meta

      return saveOne(values, record, tableProps.saveApi, tableProps.transformBeforeSave, undefined,
        isAdd, tableProps.listApi, tableProps.cacheKey, tableProps.idKey)
      // return true
    }}>
    <ProFormSelect
      name="domainId"
      label="所属"
      request={() => asyncSelectProps2Request<Domain, DomainQueryParams>({
        key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
        url: `${Host}/api/rule/composer/list/domain`,
        query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
        convertFunc: (item) => {
          return { label: item.label, value: item.id }
        }
      })}
    />
    <ProFormText
      name="label"
      label="名称"
      rules={[{ required: true, message: '必填' }]}
    />

    <ProFormDependency name={["domainId"]}>
      {({ domainId }) => {
        return <Form.Item label="已选表达式" rules={[{ required: true, message: '必填' }]}>
          {complexExpressionMeta2String(meta)} <ComplexExpressionMetaEditorModal onDone={setMeta}
            domainId={domainId} value={meta} />
        </Form.Item>
      }}
    </ProFormDependency>

    <ProFormText
      hidden
      initialValue='Complex'
      name="type"
      label="类型" />


    <ProFormTextArea
      name="remark"
      label="备注" />
  </ModalForm>
}