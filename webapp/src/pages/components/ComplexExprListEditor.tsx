import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, MenuProps, Space, Table, Tooltip, message } from 'antd';

import { cachedGet, ArrayUtil } from "@rwsbillyang/usecache"

import { BasicExpression, BasicExpressionMeta, BasicExpressionRecord, ComplexExpressionMeta, ComplexExpressionRecord, ExpressionMeta, ExpressionRecord, Opcode } from '../DataType';
import { BasicExprMetaEditModalV2 } from './BasicExprMetaEditModalV2';
import { basicExpressionMeta2String, basicMeta2Expr, complexExpressionMeta2String, complexMeta2Expr, meta2Expr, sortedConcat } from '../utils';

import md5 from "md5"
import { Host } from '@/Config';
import { LogicalOpKey } from './ComplexExprMetaEditModal';
import { ColumnsType } from 'antd/lib/table';


export const ComplexExprListEditor: React.FC<{ domainId?: number, meta: ComplexExpressionMeta, onSelectedChange: (keys: string[], records?: ExpressionRecord[]) => void }> = ({ domainId, meta, onSelectedChange }) => {

  //transfer left list
  //先getAllExpr加载所有expression记录，在编辑状态下，然后试图从meta中解构出来一些
  const [exprList, setExprList] = useState<ExpressionRecord[]>([])
  //selectedKeys list
  const [selectedKeys, setSelectedKeys] = useState<string[]>();
  const { current } = useRef<{ allRecords: ExpressionRecord[], allExprList: ExpressionRecord[] }>({ allRecords: [], allExprList: [] }) //用于从现有记录中查询名称

  useMemo(() => {
    if (selectedKeys) onSelectedChange(selectedKeys, getByIds(exprList, selectedKeys, "key"))
  }, [selectedKeys])

  //加载全部expression记录
  const getAllExpr = (meta?: ComplexExpressionMeta) => {
    //console.log("getAllExpr...")
    cachedGet<ExpressionRecord[]>(`${Host}/api/rule/composer/list/expression`, (data) => {
      current.allRecords = data
      const result: ExpressionRecord[] = []
      data.forEach((e) => destructExpressionRecord(result, e, data))

      //console.log("getAllExpr, size=" + data.length + ", after destruct, size=" + result.length)
      destructMeta(result, meta)
    }, { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }//pageSize: -1为全部加载)
      , "expression/domain/" + domainId
    )
  }

  //解析现有的ComplexExpressionMeta
  const destructMeta = (result: ExpressionRecord[], meta?: ComplexExpressionMeta) => {
    console.log("destructMeta... ")
    //编辑状态下，首次加载使用待编辑的meta?.metaList

     destructComplexMetaList(result, current.allRecords, meta?.metaList)

    // if (list.length > 0) {
    //   list.forEach((e) => {
    //     pushIfNotPresent(result, e)
    //   })
    // }

   // const list2 = getTargetKeysByMeta(meta)

    //console.log("destructMeta done! get size=" + list.length + ", and target keys size=" + list2.length)

    current.allExprList = result
    setExprList(result)
    console.log("finally,  exprList=", result)
  }

  //加载domainId下所有表达式， 用于放置在transfer的左侧， 然后解析现有的ComplexExpressionMeta
  useEffect(() => { getAllExpr(meta) }, [meta])




  const columns: ColumnsType<ExpressionRecord> = [
    {
      title: 'Name',
      render: (value, record, index) => {
        const str = record.label || "临时"
        return <div>{str}</div>
      },
    },
    {
      title: 'content',
      render: (value, record, index) => {
        let str = ""
        if (record.type === "Complex") {
          str = complexExpressionMeta2String((record as ComplexExpressionRecord).meta)
        } else {
          str = basicExpressionMeta2String((record as BasicExpressionRecord).meta)
        }
        return <div>{str}</div>
      },
    },
    {
      title: 'Action',
      key: 'operation',
      fixed: 'right',
      width: 100,
      render: (value, record, index) => <Space>
        {
          record.type === 'Basic' && <BasicExprMetaEditModalV2 cannotChooseOne={true} triggerName="编辑" domainId={domainId} meta={(record as BasicExpressionRecord).meta}
            onDone={(v) => {
              console.log("basicRecord edit done, get v=", v)
              //key and meta被替换成新值
              const expr = meta2Expr(v) as BasicExpression
              const key = md5(sortedConcat(expr))
              record.key = key
              record.meta = v
              //basicRecord2["expr"] = expr
              //basicRecord2.exprStr = JSON.stringify(expr)
              //basicRecord2.metaStr = JSON.stringify(v)

              setExprList([...exprList])
            }
            } />
        }

        <a onClick={() => {
          if (ArrayUtil.removeOne(exprList, record.key, "key")) {
            setExprList([...exprList])
          }
          if(selectedKeys && selectedKeys.length > 0){
            let flag = false
            for(let i=0; i< selectedKeys.length; i++){
              if(selectedKeys[i] === record.key){
                selectedKeys.splice(i, 1)
                flag = true
                break
              }
            }
            if(flag) setSelectedKeys([...selectedKeys])
          }
        }}>删除</a>
      </Space>,
    }
  ];


  // rowSelection object indicates the need for row selection
  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: ExpressionRecord[]) => {
      console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
      const selected = selectedRowKeys as string[]
      setSelectedKeys(selected)
      //onSelectedChange(selected, selectedRows)
    },
    selectedRowKeys: selectedKeys
  };

  return <div>
    <Table size="small" pagination={false}
      rowSelection={{
        type: 'checkbox',
        ...rowSelection,
      }}
      columns={columns}
      dataSource={exprList}
    />

    <Space>
      <BasicExprMetaEditModalV2 title="添加基本表达式" triggerName="添加基本表达式" domainId={domainId}
        onDone={(v) => {
          console.log("create basicRecord done, get v=", v)
          const mockExpr: BasicExpressionRecord = {
            key: md5(sortedConcat(meta2Expr(v))),
            meta: v,
            type: "Basic",
            label: "临时"
          }
          if (pushIfNotPresent(exprList, mockExpr, "key")) {//metaList.push(v)
            setExprList([...exprList])
            console.log("exprList=", exprList)
          } else {
            message.info("已存在相同表达式")
          }
        }} />


      <LogicalExprDropDwon disabled={!selectedKeys || selectedKeys.length < 2} title="创建子表达式" onClick={(op) => {
        const list = getByIds(exprList, selectedKeys, "key")
        if (!list || list.length < 2) {
          console.log("no selected?")
          message.info("no selected?")
          return
        }

        const metaList = list.map((e) => e.meta).filter((e) => !!e) as (BasicExpressionMeta | ComplexExpressionMeta)[]
        const meta: ComplexExpressionMeta = {
          _class: "Complex",
          op: op,
          opId: op.id,
          metaList: metaList
        }
        const mockExpr: ComplexExpressionRecord = {
          label: "临时",
          type: "Complex",
          meta: meta,
          key: md5(sortedConcat(meta2Expr(meta)))
        }

        if (pushIfNotPresent(exprList, mockExpr, "key")) //metaList.push(meta)
        {
          setExprList([...exprList])
          setSelectedKeys([])
          console.log("successful to add one complexExpressionMeta to left")
        } else {
          console.log("left already exsit")
          message.info("左侧已存在相同条件")
        }

      }} />

      <Button disabled={!selectedKeys || selectedKeys.length == 0}
        onClick={() => {
          if (ArrayUtil.removeMany(exprList, selectedKeys, "key")) {
            setExprList([...exprList])
            setSelectedKeys(undefined)
          }
        }}>删除选中</Button>

        <Button disabled={!selectedKeys || selectedKeys.length == 0}
        onClick={() => {
          setSelectedKeys(undefined)
        }}>清除选中</Button>
    </Space>
  </div>
}



/**
* 解
* 给表达式记录项添加md5 key，用于添加到exprList中；
* 若是复合表达式记录项，拆解出各基本表达式，构造临时模拟记录，并给它们添加上key
* @param e 待拆解meta的表达式
* @param allRecords 现有记录，用于从中查找获取label
* @param result 盛放结果  
*/
function destructExpressionRecord(result: ExpressionRecord[], e: ExpressionRecord, allRecords: ExpressionRecord[]) {


  if (!e.expr && e.exprStr) { e.expr = JSON.parse(e.exprStr) }
  if (!e.meta && e.metaStr) e.meta = JSON.parse(e.metaStr)

  if (e.expr) {
    e.key = md5(sortedConcat(e.expr))
    pushIfNotPresent(result, e, "key")//add self
  } else {
    console.warn("no expr, expr redord id=" + e.id)
  }

  if (e.type === "Complex") {
    const expr = e as ComplexExpressionRecord
    if (expr.meta) {
      destructComplexMetaList(result, allRecords, expr.meta.metaList, expr)
    } else {
      console.warn("no meta, complex expr redord id=" + e.id)
    }
  }
}

/**
 * 
 * @param allRecords 数据库中现有记录，它们有label，需要用到
 * @param metaList ComplexExpressionMeta中的metaList
 * @param expr metaList属于哪个record，有可能没有，因为是临时创建的
 * @param result 盛放添加了key的mock记录，并且经过了去重
 * @returns 
 */
function destructComplexMetaList(result: ExpressionRecord[], allRecords: ExpressionRecord[], metaList?: ExpressionMeta[], expr?: ComplexExpressionRecord) {
  if (!metaList) return 

  metaList.forEach((e) => {
    if (e._class === "Complex") {
      const meta = e as ComplexExpressionMeta
      const key = md5(sortedConcat(complexMeta2Expr(meta)))
      const label = expr?.label || ArrayUtil.findOne(allRecords, key, "key")?.label
      const mockExpr: ComplexExpressionRecord = { label: label ? label + "-" + result.length : "临时", meta, key, type: "Complex" }
      pushIfNotPresent(result, mockExpr, "key")
      destructComplexMetaList(result, allRecords, meta.metaList, expr)
    } else {
      const meta = e as BasicExpressionMeta
      const key = md5(sortedConcat(basicMeta2Expr(meta)))
      const label = expr?.label || ArrayUtil.findOne(allRecords, key, "key")?.label
      const mockExpr: BasicExpressionRecord = { label: label ? label + "-" + result.length : "临时", meta, key, type: "Basic" }
      pushIfNotPresent(result, mockExpr, "key")
    }
  });
}


/**
 * 
 * @param expr 将复合表达式complexExpr中的meta的metaList提取出来，得到其md5列表
 * @returns 若类型非complex，或空，或没有metaList，则返回空列表
 */
// function getTargetKeysByMeta(meta?: ComplexExpressionMeta) {
//   const list: string[] = []
//   if (!meta || meta._class !== "Complex") return list

//   meta.metaList?.forEach((e) => {
//     list.push(md5(sortedConcat(meta2Expr(e))))
//   })

//   return list
// }


/**
* 逻辑表达式操作符选择下拉DropDwon
* @param title 展示的名称
* @param disabled 是否激活，当表达式列表为空时，应为true
* @param onClick 点击选中哪个操作符
* @returns 
*/
const LogicalExprDropDwon: React.FC<{ title?: string, disabled?: boolean, onClick: (e: Opcode) => void }> = ({ title, disabled, onClick }) => {
  const [ops, setOps] = useState<Opcode[]>([])
  useEffect(() => {
    cachedGet<Opcode[]>(`${Host}/api/rule/composer/list/opcode`, (data) => setOps(data),
      { type: 'Logical', pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载)
      LogicalOpKey)
  }, [])

  const onClick2: MenuProps['onClick'] = ({ key }) => {
    const e = ArrayUtil.findOne(ops, key, "code")
    if (e) onClick(e)
    else console.log("clicked key=" + key + ", but not found in ops=", ops)
  };

  // return <Select disabled={disabled} options={ops?.map((e) => ({
  //   label:  e.label,
  //   value: e.code
  // }))}/>


  return <Dropdown.Button
    disabled={disabled}
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
* 
* @param array 若数组中已存在，则忽略，否则push进去
* @param id 
* @param idKey 
* @returns 添加成功则返回true
*/
function pushIfNotPresent<T>(array: T[], e: T, idKey: string = "key") {
  for (let i = 0; i < array.length; i++) {
    if (array[i][idKey] === e[idKey]) {
      return false
    }
  }
  array.push(e)
  return true
}

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