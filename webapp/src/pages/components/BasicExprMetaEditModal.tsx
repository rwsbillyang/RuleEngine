import React, { useEffect, useRef, useState } from "react";
import { ModalForm, ProFormDependency, ProFormInstance, ProFormSelect, ProFormText } from "@ant-design/pro-form";
import { BasicExpressionMeta, ConstantQueryParams, Expression, ExpressionQueryParams, Operator, OperatorQueryParams, Param, ParamQueryParams } from "../DataType";

import { Cache, contains } from "@rwsbillyang/usecache"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps";
import { Host } from "@/Config";
import { ValueMetaEditor } from "./ValueMetaEditor";
import { message } from "antd";
import { getBasicTypeId, typeCode2Id } from "../utils";


const ExpressionKeyPrefix = "basicExpression/domain/"
const ParamKeyPrefix = "param/domain/"
const OpKeyPrefix = "op/type/"

/***
 * 编辑基本表达式BasicExpressionMeta，确定键值、比较符和操作数
 * @param title 展示的名称，如需自定义可指定
 * @param triggerName trigger中名称，如需自定义可指定
 * @param domainId
 * @param onDone 完成后执行的回调
 * @param exprId 选择一个现有的表达式记录，来自于哪个expression id
 * @param meta 初始值BasicExpressionMeta
 * @param cannotChooseOne 若为true则不能选择现有的表达式，只能新建或编辑一个BasicExpressionMeta，适用于Record的新增或编辑
 */
export const BasicExprMetaEditModal: React.FC<{
  title?: string,
  triggerName?: string,
  domainId?: number,
  onDone: (meta: BasicExpressionMeta, newExprId?: number) => void,
  exprId?: number,
  meta?: BasicExpressionMeta
  cannotChooseOne?: boolean
}> = ({ title, triggerName, domainId, onDone, exprId, meta, cannotChooseOne }) => {
  const initialMeta: BasicExpressionMeta = { _class: "Basic" }
  const [newExprId, setNewExprId] = useState(exprId)
  const [newMeta, setNewMeta] = useState(meta || initialMeta)
  //console.log("BasicExprMetaEditModal, meta=", meta)
  //console.log("BasicExprMetaEditModal, newMeta=", newMeta)


  const formRef = useRef<ProFormInstance>()
  useEffect(() => {
    if (newExprId) {
      const expression: Expression | undefined = Cache.findOne(ExpressionKeyPrefix + domainId, newExprId, "id")
      const meta = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined
      console.log("=====update newMeta by newExprId=" + newExprId, meta)

      if(meta) setNewMeta(meta)
      else{
        console.log("no expression or expression.metaStr when newExprId changed")
      }

      //子组件因为使用了useState，传入的meta不能生效，故采用发送事件方式更新
      //dispatch({ type: "updateMetaValue", payload: meta })

      formRef?.current?.setFieldValue("paramId", meta?.paramId)
      formRef?.current?.setFieldValue("opId", meta?.opId)
    } else {//清空了exprId
      console.log("no exprId...")
    }

  }, [newExprId])



  return <ModalForm
    formRef={formRef}
    layout="horizontal"
    title={title || "编辑基本表达式"}
    trigger={<a >{triggerName || "编辑"}</a>}
    autoFocusFirstInput
    modalProps={{
      destroyOnClose: false,
    }}
    onValuesChange={(v) => {
      console.log("onValuesChange:" + JSON.stringify(v))

      //exprId清空(先不为空，后为空)才执行
      if(newExprId && !v?.exprId){ // 其它字段修改，该条件也成立
        console.log("newExprId reset...")
        setNewMeta(initialMeta)
        formRef?.current?.setFieldValue("paramId", undefined)
        formRef?.current?.setFieldValue("opId", undefined)
      }
      setNewExprId(v?.exprId)
      
    }}
    submitTimeout={2000}
    onFinish={async (values) => {
      //console.log("BasicExprMetaEditModal: ModalForm.onFinish: values=", );
      
      if(!newMeta.opId || !newMeta.paramId 
        || (!newMeta.other && !newMeta.start && !newMeta.end && !newMeta.e && !newMeta.set && newMeta.num === undefined))
    {
        console.log("newMeta=",newMeta)
        message.warning("表达式信息不全")
        return false
      }else{
        newMeta._class = values._class
        onDone(newMeta, newExprId)
        return true
      }
    }}>


    <ProFormSelect
      name="exprId"
      label="现有基本表达式"
      hidden={cannotChooseOne}
      tooltip="使用现有表达式，或新创建一个"
      initialValue={newExprId}
      request={cannotChooseOne? undefined : () => asyncSelectProps2Request<Expression, ExpressionQueryParams>({
        key: ExpressionKeyPrefix + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
        url: `${Host}/api/rule/composer/list/expression`,
        query: { domainId: domainId, type: "Basic", pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
        convertFunc: (item) => {
          return { label: item.label, value: item.id }
        }
      })}
    />

    <ProFormText hidden name="_class" initialValue="Basic" />


    <ProFormDependency name={["exprId"]}>
      {({ exprId }) => {
        return <>
          <ProFormSelect
            name="paramId"
            label="变量"
            initialValue={newMeta?.paramId}
            disabled={!!exprId}
            request={() => asyncSelectProps2Request<Param, ParamQueryParams>({
              key: ParamKeyPrefix + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
              url: `${Host}/api/rule/composer/list/param`,
              query: { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
              convertFunc: (item) => {
                return { label: "(" + item.paramType.label + ")" + item.label, value: item.id }
              }
            })}
          />

          <ProFormSelect
            name="opId"
            initialValue={newMeta?.opId}
            label="比较符"
            disabled={!!exprId}
            dependencies={['paramId']}
            request={(params) => asyncGetOpOptions(params.paramId, domainId)}
          />
        </>
      }}
    </ProFormDependency>

    <ProFormDependency name={["exprId", "paramId", "opId"]}>
      {({ exprId, paramId, opId }) => {
        let operandConfig: OperandConfig //= calulateConfig(exprId, paramId, opId)

        if (exprId) {
          // const expression: Expression | undefined = Cache.findOne("expression/domain/" + domainId, newExprId, "id")
          // const meta = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined

          // console.log("update newMeta")

          //未在useEffect中赋值，改由此处更新newMeta信息
          //newMeta.param = meta.param
          //newMeta.op = meta.op
          // newMeta.opId = meta.opId
          // newMeta.paramId = meta.paramId
          // newMeta.other = meta.other
          // newMeta.start = meta.start
          // newMeta.end = meta.end
          // newMeta.set = meta.set
          // newMeta.e = meta.e
          // newMeta.num = meta.num

          operandConfig = checkAvailable(newMeta?.param, newMeta?.op)
          operandConfig.param = newMeta?.param
          operandConfig.op = newMeta?.op
          operandConfig.err = !newMeta?.param ? "no param in meta" : undefined
          operandConfig.multiple = newMeta?.param ? newMeta.param.paramType.code.indexOf("Set") > 0 : false
        } else {
          operandConfig = getValueMapParam(domainId, paramId, opId)
          newMeta.paramId = paramId
          newMeta.opId = opId
        }
        //将param和op元数据保留下来
        newMeta.param = operandConfig.param  //newMeta.paramId更新后也需要更新对应的param
        newMeta.op = operandConfig.op //同上
       
        //console.log(newMeta)

        //去掉不需要的，上次修改时保留的值
        if(newMeta){
            if (!operandConfig.other) delete newMeta.other
            if (!operandConfig.start) delete newMeta.start
            if (!operandConfig.end) delete newMeta.end
            if (!operandConfig.set) delete newMeta.set
            if (!operandConfig.e) delete newMeta.e
            if (!operandConfig.num) delete newMeta.num
        }
        

        return operandConfig.err ? <div> {operandConfig.err} </div> : <>
          {operandConfig.other && <ValueMetaEditor name="other" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, operandConfig.param)} label="值" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={operandConfig.multiple === true} value={newMeta.other} onChange={(v) => { setNewMeta({ ...newMeta, other: v }) }} />}

          {operandConfig.start && <ValueMetaEditor name="start" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, operandConfig.param)} label="起始" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={false} value={newMeta.start} onChange={(v) => { setNewMeta({ ...newMeta, start: v }) }} />}

          {operandConfig.end && <ValueMetaEditor name="end" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, operandConfig.param)} label="终止" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={false} value={newMeta.end} onChange={(v) => { setNewMeta({ ...newMeta, end: v }) }} />}

          {operandConfig.set && <ValueMetaEditor name="set" constantQueryParams={getConstantQueryParams({ toSetType: true }, domainId, operandConfig.param)} label="集合" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={true} value={newMeta.set} onChange={(v) => { setNewMeta({ ...newMeta, set: v }) }} />}

          {operandConfig.e && <ValueMetaEditor name="e" constantQueryParams={getConstantQueryParams({ toBasicType: true }, domainId, operandConfig.param)} label="某项" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={false} value={newMeta.e} onChange={(v) => { setNewMeta({ ...newMeta, e: v }) }} />}

          {operandConfig.num && <ValueMetaEditor name="num" constantQueryParams={getConstantQueryParams({ paramType: ["Int", "Long"] }, domainId, operandConfig.param)} disabled={!!exprId} label="数量" param={operandConfig.param} domainId={domainId} multiple={false} value={newMeta.num} onChange={(v) => { setNewMeta({ ...newMeta, num: v }) }} />}
        </>
      }}
    </ProFormDependency>

  </ModalForm>
}




//加载操作符list，必须等上面的param加载完毕后再加载，因为需要利用其缓存
const asyncGetOpOptions = (paramId?: number, domainId?: number) => {
  console.log("asyncGetOpOptions：domainId= + ” + domainId + “, paramId=" + paramId)
    if (!paramId) return new Promise(resolve => resolve([]))
  
    const param: Param | undefined = Cache.findOne(ParamKeyPrefix+ domainId, paramId, "id")//Cache.findOne("param/domain/" + domainId, paramId, "id")
    if (!param) {
      console.log("Not found param for paramId=" + paramId)
      return new Promise(resolve => resolve([]))
    }
    const supportOps = param.paramType.supportOps
    if (supportOps && supportOps.length > 0) {
      return new Promise(resolve => resolve(supportOps.map((item) => { return { label: item.label + "(" + item.code + ")", value: item.id } })))
    } else {
      return asyncSelectProps2Request<Operator, OperatorQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
        key: OpKeyPrefix + param.paramType.id,//不提供key，则不缓存，每次均从远程请求
        url: `${Host}/api/rule/composer/list/operator`,
        query: { ids: param.paramType.supportOpIds, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => {
          return { label: item.label + "(" + item.code + ")", value: item.id }
        }
      })
    }
  }
  
  
interface OperandConfig {
    err?: string
    other?: boolean,
    start?: boolean,
    end?: boolean,
    e?: boolean,
    set?: boolean,
    num?: boolean,
    multiple?: boolean,
    param?: Param,
    op?: Operator
  }
  
const getValueMapParam = (domainId?: number, paramId?: number, opId?: number) => {
    const param: Param | undefined = Cache.findOne(ParamKeyPrefix + domainId, paramId, "id")
    let config: OperandConfig = {}
    if (!param) {
      config.err = "请选择变量和比较符"
    } else {
      const code = param.paramType.code
      const multiple = code.indexOf("Set") > 0
  
      let op: Operator | undefined = param.paramType.supportOps ? Cache.findOneInArray(param.paramType.supportOps, opId, "id") : undefined
      if (!op) op = Cache.findOne(OpKeyPrefix + param.paramType.id, opId, "id")
  
      config = checkAvailable(param, op)
      //console.log(c)
  
      config.multiple = multiple
      config.param = param
      config.op = op
    }
    return config
  }
  
  export const checkAvailable = (param?: Param, op?: Operator) => {
    const config: OperandConfig = {}
    if (!param || !op) return config
    if (param.paramType.code === 'Bool') {
      config.other = true
      return config
    }
    const opCode = op.code
    //console.log("opCode="+opCode)
    if (param.paramType.isBasic) {
      if (contains(["eq", "ne", "lt", "lte", "gt", "gte"], opCode, (e1, e2) => e1 === e2))
        config.other = true
      else if (opCode === 'between' || opCode === 'notBetween') {
        config.start = true
        config.end = true
      } else if (opCode === 'in' || opCode === 'nin')
        config.set = true
      else {
        console.log("basic Should NOT come here: opCode=" + opCode)
      }
    } else {
      if (opCode === 'contains' || opCode === 'notContains')
        config.e = true
      else if (opCode === 'containsAll' || opCode === 'anyIn' || opCode === 'allIn' || opCode === 'allNotIn') {
        config.other = true
      } else if (opCode === 'numberIn' || opCode === 'gteNumberIn' || opCode === 'lteNumberIn') {
        config.other = true
        config.num = true
      } else {
        console.log("set Should NOT come here: opCode=" + opCode)
      }
    }
    return config
  }
  
  
  /**
   * 使用哪种类型的变量
   * 优先顺序：paramType > toSetType > toBasicType > useSelf
   */
  export interface ParamTypeConfig {
    paramType?: string[]
    toSetType?: boolean,
    toBasicType?: boolean
    useSelf?: boolean
  }
  
  
  
  /**
   * 在构建基本表达式时，为参数变量param选择常量时，会有不同
   * 
   * 变量：可以是任何类型
   * 而other、start、end、set、e、num等操作数选择常量时：
   * 若变量有值域，则仅使用其值域常量（即只有其对应枚举类型）
   * 
   * 若没有，则根据param的类型以及other、start、end、set、e、num等情形做相应变换
   * 对于num永远使用指定的Int和Long类型
   * 如何变换则由ParamTypeConfig指定
   * 
   * 
   * @param param 
   * @param paramTypeCode 如果不提供将使用param的类型，因为有的比较符要求操作数类型与自己并不一致，如集合是否包含某项，某变量是否在集合中，交集数量等
   * @returns 返回ConstantQueryParams，其中包含了domainId，pagination, 以及ids或typeIds等字段
   */
 const getConstantQueryParams = (config: ParamTypeConfig, domainId?: number, param?: Param) => {
  
    const queryParams: ConstantQueryParams = { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }//pageSize: -1为全部加载
    if (!param) return queryParams
  
    if (param.valueScopeIds && param.valueScopeIds.length > 0) {
      queryParams.ids = param.valueScopeIds
      return queryParams
    } else {
      if (config.paramType && config.paramType.length > 0) {
        queryParams.typeIds = config.paramType.map((e) => typeCode2Id(e)).filter((e) => e !== undefined).join(",")
      } else if (config.toSetType) {
        const setTypeId = typeCode2Id(param.paramType.code + "Set") || param.paramType.id
        queryParams.typeIds = [setTypeId].join(",")
      } else if (config.toBasicType) {
        const basicTypeId = getBasicTypeId(param.paramType.id) || param.paramType.id
        queryParams.typeIds = [basicTypeId].join(",")
      } else {
        queryParams.typeIds = [param.paramType.id].join(",")
      }
      //console.log("queryParams=" + JSON.stringify(queryParams))
      return queryParams
  
    }
  }
  
  
  