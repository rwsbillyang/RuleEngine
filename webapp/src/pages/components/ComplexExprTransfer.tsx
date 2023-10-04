import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown, MenuProps, Space, Tooltip, Transfer, message } from 'antd';
import { TransferDirection, TransferListProps } from 'antd/es/transfer';

import { cachedGet, ArrayUtil } from "@rwsbillyang/usecache"

import { BasicExpression, BasicExpressionMeta, BasicExpressionRecord, ComplexExpressionMeta, ComplexExpressionRecord, ExpressionMeta, ExpressionRecord, Opcode } from '../DataType';
import { BasicExprMetaEditModal } from './BasicExprMetaEditModal';
import { basicExpressionMeta2String, basicMeta2Expr, complexExpressionMeta2String, complexMeta2Expr, meta2Expr, sortedConcat } from '../utils';

import md5 from "md5"
import { Host } from '@/Config';
import { LogicalOpKey } from './ComplexExprMetaEditModal';

export const ComplexExprTransfer: React.FC<{ domainId?: number, meta: ComplexExpressionMeta, onSelectedChange: (keys: string[], records?: ExpressionRecord[]) => void }> = ({ domainId, meta, onSelectedChange }) => {

  //transfer left list
  //先getAllExpr加载所有expression记录，在编辑状态下，然后试图从meta中解构出来一些
  const [exprList, setExprList] = useState<ExpressionRecord[]>([])
  const [basicRecord1, setBasicRecord1] = useState<BasicExpressionRecord>()
  const [basicRecord2, setBasicRecord2] = useState<BasicExpressionRecord>()

  //transfer right list
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [sourceSelectKeys, setSourceSelectedKeys] = useState<string[]>();
  const { current } = useRef<{ allRecords: ExpressionRecord[], allExprList: ExpressionRecord[]}>({ allRecords: [], allExprList: []}) //用于从现有记录中查询名称
  
  useMemo(()=>{
    onSelectedChange(targetKeys, getByIds(exprList, targetKeys, "key"))
  }, [targetKeys])

  //加载全部expression记录
  const getAllExpr = (meta?: ComplexExpressionMeta) => {
    //console.log("getAllExpr...")
    cachedGet<ExpressionRecord[]>(`${Host}/api/rule/composer/list/expression`, (data) => {
      current.allRecords = data
      const result: ExpressionRecord[] = []
      data.forEach((e) => destructExpressionRecord(e, data, result))
      
      //console.log("getAllExpr, size=" + data.length + ", after destruct, size=" + result.length)
      destructMeta(result,meta)
    }, { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }//pageSize: -1为全部加载)
      ,"expression/domain/" + domainId
    )
  }

  //解析现有的ComplexExpressionMeta
  const destructMeta = (result: ExpressionRecord[], meta?: ComplexExpressionMeta) => {
   // console.log("destructMeta... ")
      //编辑状态下，首次加载使用待编辑的meta?.metaList
      const list = destructComplexMetaList(current.allRecords, meta?.metaList)

      if (list.length > 0) {
        list.forEach((e) => {
          pushIfNotPresent(result, e)
        })
      }

      const list2 = getTargetKeysByMeta(meta)
      if (list2.length > 0) 
        setTargetKeys(list2)
      else 
        setTargetKeys([])

      //console.log("destructMeta done! get size=" + list.length + ", and target keys size=" + list2.length)

    current.allExprList = result
    setExprList(result)
    //console.log("finally,  exprList=", result)
  }

  //加载domainId下所有表达式， 用于放置在transfer的左侧， 然后解析现有的ComplexExpressionMeta
  useEffect(() => { getAllExpr(meta) }, [meta])


  //transfer foot
  const renderFooter = (props: TransferListProps<BasicExpressionRecord | ComplexExpressionRecord>, info?: {
    direction: TransferDirection;
  }) => {
    if (!info || info?.direction === 'left') {
      return (
        <Space>
          <BasicExprMetaEditModal title="添加基本表达式" triggerName="添加基本表达式" domainId={domainId}
            onDone={(v) => {
              console.log("create basicRecord done, get v=",v)
              const mockExpr: BasicExpressionRecord = { 
                key: md5(sortedConcat(meta2Expr(v))), 
                meta: v, 
                type: "Basic", 
                label: "临时"
               }
              if (pushIfNotPresent(exprList, mockExpr, "key")){//metaList.push(v)
                setExprList([...exprList])
                console.log("exprList=",exprList)
              }else {
                message.info("已存在相同表达式")
              }
            }} />

          {basicRecord1 && <BasicExprMetaEditModal cannotChooseOne={true} triggerName="编辑当前选中" domainId={domainId} meta={basicRecord1.meta}
            onDone={(v) => {
              console.log("left basicRecord1 edit done, get v=",v)
              //key and meta被替换成新值
              const expr = meta2Expr(v) as BasicExpression
              const key = md5(sortedConcat(expr))
              if(key !== basicRecord1.key){
                basicRecord1.key = key
                basicRecord1.meta = v
                //basicRecord1["expr"] = expr
                //basicRecord1.exprStr = JSON.stringify(expr)
                //basicRecord1.metaStr = JSON.stringify(v)

                let flag = false
                for(let i=0; i<targetKeys.length; i++){
                  if(targetKeys[i] === key){
                    targetKeys[i] = key
                    flag = true
                  }
                }
                if(flag) setTargetKeys([...targetKeys])
                setExprList([...exprList])
                //setBasicRecord1
              }
            }} />}
            {
              (sourceSelectKeys && sourceSelectKeys.length > 0) && <a onClick={()=>{
                if(ArrayUtil.removeMany(exprList, sourceSelectKeys, "key")){
                  setExprList([...exprList])
                  setSourceSelectedKeys(undefined)
                }
                    
              }}>删除选中</a>
            }
        </Space>

      );
    } else
      return (
        <Space>
          <LogicalExprDropDwon disabled={targetKeys.length < 2} title="添加到左侧" onClick={(op) => {
            const list = getByIds(exprList, targetKeys, "key")
            if (list?.length === targetKeys.length) {
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
                setTargetKeys([])
                console.log("successful to add one complexExpressionMeta to left")
              } else {
                console.log("left already exsit")
                message.info("左侧已存在相同条件")
              }

            } else {
              console.warn("fail to get metaList from targetKeys=", targetKeys)
            }

          }} />
          {basicRecord2 && <BasicExprMetaEditModal cannotChooseOne={true} triggerName="编辑当前选中" domainId={domainId} meta={basicRecord2.meta}
            onDone={(v) => {
              console.log("right basicRecord2 edit done, get v=",v)
               //key and meta被替换成新值
               const expr = meta2Expr(v) as BasicExpression
               const key = md5(sortedConcat(expr))
                basicRecord2.key = key
                basicRecord2.meta = v
                //basicRecord2["expr"] = expr
                //basicRecord2.exprStr = JSON.stringify(expr)
                //basicRecord2.metaStr = JSON.stringify(v)

                let flag = false
                for(let i=0; i<targetKeys.length; i++){
                  if(targetKeys[i] === key){
                    targetKeys[i] = key
                    flag = true
                  }
                }
                if(flag) setTargetKeys([...targetKeys])
                setExprList([...exprList])
   
              }
            } />}
        </Space>

      );
  };


  return <Transfer
    dataSource={exprList}
    titles={['候选表达式', '已选表达式']}
    listStyle={{
      width: 300,
      height: 300,
    }}
    targetKeys={targetKeys}
    onChange={(newTargetKeys: string[]) => {
      setTargetKeys(newTargetKeys)
    }}
    onSelectChange={(sourceSelectedKeys, targetSelectedKeys) => {
      // console.log("onSelectChange: sourceSelectedKeys=" + JSON.stringify(sourceSelectedKeys) 
      // + ", targetSelectedKeys=" + JSON.stringify(targetSelectedKeys) 
      // + ", exprList=",exprList) //第一次点击选中时，exprList总是为空，事实上，其已经有多个元素了
      if (sourceSelectedKeys.length === 1) {
        //第一次点击选中时，exprList总是为空，事实上，其已经有多个元素了.
        //改用current.allExprList解决问题，current.allExprList在完成exprList的初始化添加更新后，也被更新
        const list = getByIds(current.allExprList, sourceSelectedKeys, "key")
        if (list?.length === 1 && list[0].type === "Basic")
        {
            setBasicRecord1(list[0] as BasicExpressionRecord)
          //  console.log("onSelectChange: left BasicRecord1=", list[0])
        }
        else
          setBasicRecord1(undefined)
      } else {
        setBasicRecord1(undefined)
      }
      setSourceSelectedKeys(sourceSelectedKeys)

      if (targetSelectedKeys.length === 1) {
        const list = getByIds(current.allExprList, targetSelectedKeys, "key")
        if (list?.length === 1 && list[0].type === "Basic")
        { 
          setBasicRecord2(list[0] as BasicExpressionRecord)
         // console.log("onSelectChange: right BasicRecord2=", list[0])
        }else
        {
           setBasicRecord2(undefined)
        }
      } else {
        setBasicRecord2(undefined)
      }
    }}

    render={(item) => {
      let str
      if (item.type === "Complex") {
        str = complexExpressionMeta2String((item as ComplexExpressionRecord).meta)
      } else {
        str = basicExpressionMeta2String((item as BasicExpressionRecord).meta)
      }
      const customLabel = (
        <span style={{ width: '100' }}>
          [{item.label || "临时"}] {str}
        </span>
      );

      return {
        label: customLabel, // for displayed item
        value: item.label || "临时", // for title and filter matching
      };
    }
    }
    footer={renderFooter}
  />
}



/**
* 解
* 给表达式记录项添加md5 key，用于添加到exprList中；
* 若是复合表达式记录项，拆解出各基本表达式，构造临时模拟记录，并给它们添加上key
* @param e 待拆解meta的表达式
* @param allRecords 现有记录，用于从中查找获取label
* @param result 盛放结果  
*/
function destructExpressionRecord(e: ExpressionRecord, allRecords: ExpressionRecord[], result?: ExpressionRecord[]) {
  const list = result || []

  //if (!e) return list

  if (!e.expr && e.exprStr) { e.expr = JSON.parse(e.exprStr) }
  if (!e.meta && e.metaStr) e.meta = JSON.parse(e.metaStr)

  if (e.expr) {
    e.key = md5(sortedConcat(e.expr))
    pushIfNotPresent(list, e, "key")//add self
  } else {
    console.warn("no expr, expr redord id=" + e.id)
  }

  if (e.type === "Complex") {  
    const expr = e as ComplexExpressionRecord
    if (expr.meta) {
      destructComplexMetaList(allRecords, expr.meta.metaList, expr, list)
    } else {
      console.warn("no meta, complex expr redord id=" + e.id)
    }
  }

  return list
}

/**
 * 
 * @param allRecords 数据库中现有记录，它们有label，需要用到
 * @param metaList ComplexExpressionMeta中的metaList
 * @param expr metaList属于哪个record，有可能没有，因为是临时创建的
 * @param result 盛放添加了key的mock记录，并且经过了去重
 * @returns 
 */
function destructComplexMetaList(allRecords: ExpressionRecord[], metaList?: ExpressionMeta[], expr?: ComplexExpressionRecord, result?: ExpressionRecord[]) {
  const list = result || []
  if (!metaList) return list

  metaList.forEach((e) => {
    if (e._class === "Complex") {
      const meta = e as ComplexExpressionMeta
      const key = md5(sortedConcat(complexMeta2Expr(meta)))
      const label = expr?.label || ArrayUtil.findOne(allRecords, key, "key")?.label
      const mockExpr: ComplexExpressionRecord = { label: label ? label + "-" + list.length : "临时", meta, key, type: "Complex" }
      pushIfNotPresent(list, mockExpr, "key")
      destructComplexMetaList(allRecords, meta.metaList, expr, result)
    } else {
      const meta = e as BasicExpressionMeta
      const key = md5(sortedConcat(basicMeta2Expr(meta)))
      const label = expr?.label || ArrayUtil.findOne(allRecords, key, "key")?.label
      const mockExpr: BasicExpressionRecord = { label: label ? label + "-" + list.length : "临时", meta, key, type: "Basic" }
      pushIfNotPresent(list, mockExpr, "key")
    }
  });
  return list
}

/**
 * 
 * @param expr 将复合表达式complexExpr中的metaList提取出来，得到其md5列表
 * @returns 若类型非complex，或空，或没有metaList，则返回空列表
//  */
// function getTargetKeysFromExpr(complexExpr?: ExpressionRecord) {
//   const list: string[] = []
//   if (!complexExpr || complexExpr.type !== "Complex") return list
//   const expr2 = complexExpr as ComplexExpressionRecord
//   expr2.meta?.metaList?.forEach((e) => {
//     list.push(md5(sortedConcat(meta2Expr(e))))
//   })

//   return list
// }

/**
 * 
 * @param expr 将复合表达式complexExpr中的meta的metaList提取出来，得到其md5列表
 * @returns 若类型非complex，或空，或没有metaList，则返回空列表
 */
function getTargetKeysByMeta(meta?: ComplexExpressionMeta) {
  const list: string[] = []
  if (!meta || meta._class !== "Complex") return list

  meta.metaList?.forEach((e) => {
    list.push(md5(sortedConcat(meta2Expr(e))))
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