import React, { useEffect, useRef, useState } from "react";
import { ModalForm, ProFormCascader, ProFormDependency, ProFormInstance, ProFormSelect, ProFormText } from "@ant-design/pro-form";
import { AllParamTypeKey, BasicExpressionMeta, ConstantQueryParams, Expression, ExpressionQueryParams, OperandConstantQueryParam, Opcode, OpcodeQueryParams, Param, ParamCategory, ParamCategoryQueryParams, ParamQueryParams, ParamType, ParamTypeQueryParams } from "../DataType";

import { TreeCache, Cache, contains } from "@rwsbillyang/usecache"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps";
import { EnableParamCategory, Host } from "@/Config";
import { ValueMetaEditor } from "./ValueMetaEditor";
import { Space, message } from "antd";
import { getBasicTypeId, typeCode2Id } from "../utils";


const ExpressionKeyPrefix = "basicExpression/domain/"
const ParamKeyPrefix = "param/domain/"
const ParamCategoryKeyPrefix = "paramCategoryWithChildren/domain/"
const OpKeyPrefix = "op/type/"

//现有数据修改更新meta后将删除
const EnableCompatipleMode = false


/***
 * 编辑BasicExpressionMeta，确定变量(现有变量、或键及paramType)、比较符和操作数other,set,e, num etc.
 * 
 * 当编辑旧值时，旧值为meta，放在meta中
 * 当使用现有表达式时，切换exprId时，重新设置newMeta
 * 当完全新建时，meta为空
 * 
 * 编辑状态下：
 * (1) 切换exprId，将导致对应的meta被重新设置为表达式的meta，一切都改变，mapKey和paramTypeId不可用；清空exprId将导致其它字段都被重置，mapKey和paramTypeId可用
 * (2) 切换paramId，不可使用mapKey和paramTypeId；清空paramId，mapKey和paramTypeId可用，opId被重置
 * (2) 切换paramTypeId，opId被清空
 * (3) 清空或改变exprId、paramId、paramTypeId任意一个，将导致opId被清空
 * 
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

  //传递值时，必须新建一份copy，否则当新建再次打开对话框时，将仍在newMeta上修改，保存时冲掉原来的值
  const [newMeta, setNewMeta] = useState(meta ? { ...meta } : initialMeta)
  const [opTooltip, setOpTooltip] = useState<string>()

 // console.log("BasicExprMetaEditModal, meta=", meta)
 // console.log("BasicExprMetaEditModal, newMeta=", newMeta)

  

  const formRef = useRef<ProFormInstance>()
  useEffect(() => {
    if (newExprId) {//使用现有表达式切换，导致setNewMeta和setOpTooltip
      const expression: Expression | undefined = Cache.findOne(ExpressionKeyPrefix + domainId, newExprId, "id")
      const meta = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined
      console.log("=====update newMeta by newExprId=" + newExprId, meta)

      if (meta) {
        setNewMeta(meta)
        setOpTooltip(meta.op?.remark)
      } else {
        console.log("no expression or expression.metaStr when newExprId changed")
      }

      //子组件因为使用了useState，传入的meta不能生效，故采用发送事件方式更新
      //dispatch({ type: "updateMetaValue", payload: meta })
      if (EnableParamCategory) {
        formRef?.current?.setFieldValue("paramId", (meta?.paramId && meta?.param?.categoryId) ? [meta.param.categoryId, meta.paramId] : undefined)
      } else {
        formRef?.current?.setFieldValue("paramId", meta?.paramId)
      }

      formRef?.current?.setFieldValue("opId", meta?.opId)
    } else
      setOpTooltip(newMeta.op?.remark)

  }, [newExprId])



  return <ModalForm
    formRef={formRef}
    layout="horizontal"
    title={title || "编辑基本表达式"}
    trigger={<a>{triggerName || "编辑"}</a>}
    autoFocusFirstInput
    omitNil={false} //去掉将不能清除数据，因为需要undfined来清除掉旧数据
    modalProps={{
      destroyOnClose: false,
    }}
    onValuesChange={(v) => {
      //console.log("onValuesChange:" + JSON.stringify(v))

      //exprId清空(先不为空，后为空)才执行
      if (newExprId && !v?.exprId) { // 其它字段修改，该条件也成立
        console.log("newExprId reset...")
        setNewMeta(initialMeta)
        formRef?.current?.setFieldValue("paramId", undefined)
        formRef?.current?.setFieldValue("opId", undefined)
        formRef?.current?.setFieldValue("paramTypeId", undefined)
        formRef?.current?.setFieldValue("mapKey", undefined)

        newMeta.paramId = undefined
        newMeta.opId = undefined
        newMeta.paramTypeId = undefined
        newMeta.mapKey = undefined
      }
      setNewExprId(v?.exprId)

      if (v.paramId && newMeta.paramId != v.paramId) { //paramId改变
        console.log("paramId reset...")
        formRef?.current?.setFieldValue("paramTypeId", undefined)
        formRef?.current?.setFieldValue("mapKey", undefined)
        formRef?.current?.setFieldValue("opId", undefined)

        newMeta.opId = undefined
        newMeta.paramTypeId = undefined
        newMeta.mapKey = undefined
      }

      if (v.paramTypeId && newMeta.paramTypeId != v.paramTypeId) { //paramTypeId改变
        console.log("paramTypeId reset...")
        formRef?.current?.setFieldValue("opId", undefined)

        newMeta.opId = undefined
      }

    }}
    submitTimeout={2000}
    onFinish={async (values) => {
      newMeta.paramId = values.paramId
      newMeta.paramTypeId = values.paramTypeId
      newMeta.mapKey = values.mapKey
      newMeta.opId = values.opId
      newMeta._class = values._class

      if (!newMeta.opId || (!newMeta.paramId && (!newMeta.mapKey || newMeta.paramTypeId === undefined))
        || (!newMeta.other && !newMeta.start && !newMeta.end && !newMeta.e && !newMeta.set && newMeta.num === undefined)) {
        console.log("newMeta=", newMeta)
        message.warning("表达式信息不全")
        return false
      } else {
        onDone(newMeta, newExprId)
        //console.log("BasicExprMetaEditModal: ModalForm.onFinish: newMeta=", newMeta);
        return true
      }
    }}>


    <ProFormSelect
      name="exprId"
      label="现有基本表达式"
      hidden={cannotChooseOne}
      tooltip="使用现有表达式，或新创建一个"
      initialValue={newExprId}
      request={cannotChooseOne ? undefined : () => asyncSelectProps2Request<Expression, ExpressionQueryParams>({
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
          {EnableParamCategory ?
            <ProFormCascader
              name="paramId" //单选：[1, 5] 以及 [4]；
              label="已有变量"
              initialValue={newMeta?.paramId}
              disabled={!!exprId}
              request={() => asyncSelectProps2Request<ParamCategory, ParamCategoryQueryParams>({
                key: ParamCategoryKeyPrefix + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                url: `${Host}/api/rule/composer/list/paramCategory`,
                query: { domainId: domainId, setupChildren: true, pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
                convertFunc: (item) => {
                  return { label: item.label, value: item.id, children: item.children?.map((e) => ({ label: e.label, value: e.id })) }
                }
              })} /> :
            <ProFormSelect
              name="paramId"
              label="已有变量"
              initialValue={newMeta?.paramId}
              disabled={!!exprId}
              request={() => asyncSelectProps2Request<Param, ParamQueryParams>({
                key: ParamKeyPrefix + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                url: `${Host}/api/rule/composer/list/param`,
                query: { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
                convertFunc: (item) => {
                  return { label: item.label, value: item.id }
                }
              })}
            />
          }
        </>
      }}
    </ProFormDependency>

    <ProFormDependency name={["exprId", "paramId"]}>
      {({ exprId, paramId }) => {
        //console.log("update mapKey and paramType: exprId=" + exprId + ", paramId=" + paramId  )
        return <Space.Compact style={{ width: '100%' }}>
          <ProFormSelect
            label="或变量类型及键"
            width="md"
            name="paramTypeId"
            disabled={!!exprId || !!paramId}
            initialValue={newMeta?.paramTypeId}
            request={() => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
              key: AllParamTypeKey,//不提供key，则不缓存
              url: `${Host}/api/rule/composer/list/paramType`,
              query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
              convertFunc: (item) => { return { label: item.label, value: item.id } }
            })} />
          <ProFormText
            width="md"
            name="mapKey"
            initialValue={newMeta?.mapKey}
            disabled={!!exprId || !!paramId}
          />
        </Space.Compact>

      }}</ProFormDependency>

    <ProFormDependency name={["exprId", "paramId", "paramTypeId"]}>
      {({ exprId, paramId, paramTypeId }) => {
        //console.log("update op: exprId=" + exprId + ", paramId=" + paramId + ", paramTypeId=" + paramTypeId )
        return <ProFormSelect
          label="比较符"
          name="opId"
          initialValue={newMeta?.opId}
          tooltip={opTooltip}
          dependencies={["exprId", "paramId", "paramTypeId"]}//不可少，否则request不重新请求
          disabled={!!exprId}
          request={() => {
            //console.log("op request: exprId=" + exprId + ", paramId=" + paramId + ", paramTypeId=" + paramTypeId )
            //const paramId = params.paramId
            if (paramId) {
              if (EnableParamCategory) {
                if (paramId && paramId.length > 1) {
                  return asyncGetOpOptions({ categoryId: paramId[0], paramId: paramId[1], domainId, paramInMeta: newMeta.param, paramTypeInMeta: newMeta.paramType })
                } else {
                  console.warn("EnableParamCategory but only invalid paramId:", paramId)
                  return asyncGetOpOptions({ paramId: paramId[0], domainId, paramInMeta: newMeta.param, paramTypeInMeta: newMeta.paramType })
                }
              } else {
                return asyncGetOpOptions({ paramId, domainId, paramInMeta: newMeta.param, paramTypeInMeta: newMeta.paramType })
              }
            } else {
              //const paramTypeId = params.paramTypeId
              if (paramTypeId === undefined) {
                console.log("reset? not choose paramId or paramTypeId")
                return asyncGetOpOptions({ domainId, paramTypeInMeta: newMeta.paramType, paramInMeta: newMeta.param })
              } else {
                return asyncGetOpOptions({ paramTypeId, domainId, paramTypeInMeta: newMeta.paramType, paramInMeta: newMeta.param })
              }
            }
          }}
        />
      }}
    </ProFormDependency>

    <ProFormDependency name={["exprId", "paramId", "paramTypeId", "opId"]}>
      {({ exprId, paramId, paramTypeId, opId }) => {
        // console.log("update valueMeta: exprId=" + exprId + ", paramId=" + paramId + ", paramTypeId=" + paramTypeId + ", opId=" + opId)
        let operandConfig: OperandConfig = {} //= calulateConfig(exprId, paramId, opId)

        if (exprId) {
          const expression: Expression | undefined = Cache.findOne(ExpressionKeyPrefix + domainId, newExprId, "id")
          const meta = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined

          operandConfig = EnableCompatipleMode? checkMetaAvailableOld(meta?.paramType,meta?.op) : checkMetaAvailable(meta?.op)
          operandConfig.param = meta?.param
          operandConfig.paramType = meta?.paramType
          operandConfig.op = meta?.op
          operandConfig.err = (!meta?.param && !meta.mapKey) ? "no param in meta in expr" : undefined

          const paramType = meta?.param?.paramType || meta?.paramType
          operandConfig.multiple = paramType ? paramType.code.indexOf("Set") > 0 : false
        } else {
          //newMeta.opId = opId

          if (paramId) {
            if (EnableParamCategory) {//单选：[1, "乙"] 以及 [4]；
              if (paramId.length > 1) {
                operandConfig = getValueMapParam({ domainId, categoryId: paramId[0], paramId: paramId[1], opId, paramInMeta: newMeta.param, opInMeta: newMeta.op, paramTypeInMeta: newMeta.paramType })
                //newMeta.paramId = paramId
              } else {
                console.warn("EnableParamCategory is true, but paramId is not array or length is wrong, paramId=", paramId)
                operandConfig = getValueMapParam({ domainId, opId, paramInMeta: newMeta.param, opInMeta: newMeta.op, paramTypeInMeta: newMeta.paramType })
                // newMeta.paramId = paramId2 
              }
            } else {
              operandConfig = getValueMapParam({ domainId, paramId, opId, paramInMeta: newMeta.param, opInMeta: newMeta.op })
              //newMeta.paramId = paramId
            }
          } else if (paramTypeId) {
            operandConfig = getValueMapParam({ domainId, opId, paramTypeId, paramInMeta: newMeta.param, opInMeta: newMeta.op, paramTypeInMeta: newMeta.paramType })
            //console.log("getValueMapParam, opId="+opId+", paramTypeId="+paramTypeId+", operandConfig=",operandConfig)
          } else {
            console.log("no paramId/paramTypeId, not show valueMetaMap")
          }

          //有可能param和op被更新，将param和op元数据更新到newMeta
          if (operandConfig.param) newMeta.param = operandConfig.param  //newMeta.paramId更新后也需要更新对应的param
          if (operandConfig.paramType) newMeta.paramType = operandConfig.paramType
          if (operandConfig.op) newMeta.op = operandConfig.op //同上


          //去掉不需要的，上次修改时保留的值
          console.log("delete the hidden valueMeta operand, operandConfig=", operandConfig)
          if (!operandConfig.other && newMeta.other){
            console.log("delete other")
             delete newMeta.other
          }
          if (!operandConfig.start && newMeta.start){
            console.log("delete start")
             delete newMeta.start
            }
          if (!operandConfig.end && newMeta.end){
            console.log("delete end")
             delete newMeta.end
          }
          if (!operandConfig.collection && newMeta.set){
            console.log("delete set")
             delete newMeta.set
          }
          if (!operandConfig.e && newMeta.e){ 
            console.log("delete e")
            delete newMeta.e
          }
          if (!operandConfig.num && newMeta.num){
            console.log("delete num")
             delete newMeta.num
          }

        }

        //setOpTooltip(newMeta.op?.remark)
        //console.log(newMeta)
        const pType = operandConfig.param?.paramType || operandConfig.paramType
        if (!pType) {
          return <div> 请先选择变量或数据类型，将根据数据类型加载对应变量或常量</div>
        }

        return operandConfig.err ? <div> {operandConfig.err} </div> : <>
          {operandConfig.other && <ValueMetaEditor constantQueryParams={getConstantQueryParams(domainId, undefined, operandConfig.param, operandConfig.paramType, operandConfig.op, 'other')} label="操作数other" disabled={!!exprId} paramType={type2SysType(pType, operandConfig.op, 'otherTypeId')} domainId={domainId} multiple={operandConfig.multiple === true} value={newMeta.other} onChange={(v) => { setNewMeta({ ...newMeta, other: v }) }} />}

          {operandConfig.start && <ValueMetaEditor constantQueryParams={getConstantQueryParams(domainId, undefined, operandConfig.param, operandConfig.paramType, operandConfig.op, 'start')} label="起始start" disabled={!!exprId} paramType={type2SysType(pType, operandConfig.op, 'startTypeId')} domainId={domainId} multiple={false} value={newMeta.start} onChange={(v) => { setNewMeta({ ...newMeta, start: v }) }} />}

          {operandConfig.end && <ValueMetaEditor constantQueryParams={getConstantQueryParams(domainId, undefined, operandConfig.param, operandConfig.paramType, operandConfig.op, 'end')} label="终止end" disabled={!!exprId} paramType={type2SysType(pType, operandConfig.op, 'endTypeId')} domainId={domainId} multiple={false} value={newMeta.end} onChange={(v) => { setNewMeta({ ...newMeta, end: v }) }} />}

          {operandConfig.collection && <ValueMetaEditor constantQueryParams={getConstantQueryParams(domainId, undefined, operandConfig.param, operandConfig.paramType, operandConfig.op, 'collection')} label="集合set" disabled={!!exprId} paramType={type2SysType(pType, operandConfig.op, 'collectionTypeId')} domainId={domainId} multiple={true} value={newMeta.set} onChange={(v) => { setNewMeta({ ...newMeta, set: v }) }} />}

          {operandConfig.e && <ValueMetaEditor constantQueryParams={getConstantQueryParams(domainId, undefined, operandConfig.param, operandConfig.paramType, operandConfig.op, 'e')} label="某项e" disabled={!!exprId} paramType={type2SysType(pType, operandConfig.op, 'eTypeId')} domainId={domainId} multiple={false} value={newMeta.e} onChange={(v) => { setNewMeta({ ...newMeta, e: v }) }} />}

          {operandConfig.num && <ValueMetaEditor constantQueryParams={getConstantQueryParams(domainId, ["Int", "Long"], operandConfig.param, operandConfig.paramType)} disabled={!!exprId} label="数量num" paramType={Cache.findOne(AllParamTypeKey, "Int", "code")} domainId={domainId} multiple={false} value={newMeta.num} onChange={(v) => { setNewMeta({ ...newMeta, num: v }) }} />}
        </>
      }}
    </ProFormDependency>

  </ModalForm>
}


/**
 * 加载操作符list，首先从param或paramType中查找supportOps，没有的话再异步远程加载
 * param或paramType根据其id从缓存中查找，若找不到，则使用meta中提供
 * 
 * @param paramId 依据paramId（即param）加载操作符
 * @param categoryId 变量分类，treecache中需要
 * @param paramInMeta 来自meta，而不是从缓存中搜索 目的是利用上meta中现有的，而不是从新加载的缓存中寻找
 * @param domainId cacheKey中加载param时需要
 * @param paramTypeId 依据paramTypeId（即paramType））加载操作符 与paramId&categoryId 二选一
 * @param paramTypeInMeta 来自meta，而不是从缓存中搜索 目的是利用上meta中现有的，而不是从新加载的缓存中寻找
 * @returns 返回Opcode列表
 */
const asyncGetOpOptions = (
  props: {
    paramId?: number,
    categoryId?: number,
    paramInMeta?: Param,
    paramTypeId?: number,
    paramTypeInMeta?: ParamType,
    domainId?: number
  }) => {
  //console.log("asyncGetOpOptions：domainId=" + domainId + ", paramId=" + paramId)
  const { paramId, categoryId, paramInMeta, paramTypeId, paramTypeInMeta, domainId } = props
  if (paramTypeId) {
    let paramType: ParamType | undefined = Cache.findOne(AllParamTypeKey, paramTypeId, "id")
    if (!paramType) paramType = paramTypeInMeta
    if (paramType) {
      const supportOps = paramType.supportOps
      if (supportOps) {
        console.log("get supportOps from paramType.supportOps")
        return new Promise(resolve => resolve(supportOps.map((item) => { return { label: item.label + "(" + item.code + ")", value: item.id } })))
      } else {
        return asyncSelectProps2Request<Opcode, OpcodeQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
          key: OpKeyPrefix + paramTypeId,//不提供key，则不缓存，每次均从远程请求
          url: `${Host}/api/rule/composer/list/opcode`,
          query: { ids: paramType.supportOpIds, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
          convertFunc: (item) => {
            return { label: item.label + "(" + item.code + ")", value: item.id }
          }
        })
      }
    } else {
      console.warn("MapKey+paramTypeId mode: no paramType by paramTypeId=" + paramTypeId + " in cacheKey=" + AllParamTypeKey + ", nor in meta")
      return new Promise(resolve => resolve([]))
    }
  }


  if (!paramId && !paramInMeta) {
    console.log("param/paramId mode: no paramId orparamInMeta, no ops return")
    return new Promise(resolve => resolve([]))
  }

  let param: Param | undefined
  if (EnableParamCategory) {
    if (categoryId && paramId) {
      const elems = TreeCache.getElementsByPathIdsInTreeFromCache(ParamCategoryKeyPrefix + domainId, [categoryId, paramId], "id")
      if (elems) {
        param = elems[1]
      } else {
        console.warn("not found elems by path")
      }
    }
  } else {
    param = Cache.findOne(ParamKeyPrefix + domainId, paramId, "id")//Cache.findOne("param/domain/" + domainId, paramId, "id")
  }

  if (!param) param = paramInMeta

  if (!param) {
    console.warn("No param in cache by path=[" + categoryId + ", " + paramId + "], nor in meta, no ops return")
    return new Promise(resolve => resolve([]))
  }
  const supportOps = param.paramType.supportOps
  if (supportOps && supportOps.length > 0) {
    console.log("get supportOps from param.paramType.supportOps")
    return new Promise(resolve => resolve(supportOps.map((item) => { return { label: item.label + "(" + item.code + ")", value: item.id } })))
  } else {
    return asyncSelectProps2Request<Opcode, OpcodeQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
      key: OpKeyPrefix + param.paramType.id,//不提供key，则不缓存，每次均从远程请求
      url: `${Host}/api/rule/composer/list/opcode`,
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
  collection?: boolean,
  num?: boolean,
  multiple?: boolean,
  param?: Param,
  paramType?: ParamType,
  op?: Opcode
}


/**
 * 获取操作数配置OperandConfig，如other，set, start,end, e, num等是否可见，以及更新后的param或paramType， Opcode
 * param或paramType根据其id从缓存中查找，若找不到，则使用meta中提供
 * 
 * 使用paramType和Opcode返回other，set, start,end, e, num等是否可见，顺便返回更新后的paramType和Opcode以及paramType
 * 
 * @param domainId cacheKey中加载param时需要
 * @param categoryId 变量分类，treecache中需要
 * @param paramId 依据paramId（即param）加载操作符
 * @param paramInMeta 来自meta，当使用categoryId/paramId从缓存中获取Param失败时使用
 * @param opId 用于获取更新的Opcode
 * @param opInMeta 来自meta，当使用opId从缓存中获取Opcode失败时使用
 * @param paramTypeId 依据paramTypeId（即paramType））加载操作符 与paramId&categoryId 二选一
 * @param paramTypeInMeta 来自meta，当使用paramTypeId从缓存中获取Param失败时使用
 * 
 * 最终使用paramType和Opcode返回other，set, start,end, e, num等是否可见，顺便返回更新后的paramType和Opcode以及paramType
 * @returns 返回Opcode列表
 */
const getValueMapParam = (props: {
  domainId?: number,

  categoryId?: number,
  paramId?: number,
  paramInMeta?: Param,

  opId?: number,
  opInMeta?: Opcode

  paramTypeId?: number,
  paramTypeInMeta?: ParamType,
}) => {
  let config: OperandConfig = {}
  const { domainId, paramId, opId, categoryId, paramTypeId, paramInMeta, paramTypeInMeta, opInMeta } = props

  if (paramTypeId) {
    let paramType: ParamType | undefined = Cache.findOne(AllParamTypeKey, paramTypeId, "id")
    if (!paramType) paramType = paramTypeInMeta
    if (paramType) {
      const code = paramType.code
      const multiple = code.indexOf("Set") > 0

      let op: Opcode | undefined
      if (opId) {
        op = paramType.supportOps ? Cache.findOneInArray(paramType.supportOps, opId, "id") : undefined
        if (!op) op = Cache.findOne(OpKeyPrefix + paramType.id, opId, "id")
        if (!op) op = opInMeta
      }

      config =  EnableCompatipleMode? checkMetaAvailableOld(paramType, op) : checkMetaAvailable(op)
   
      //console.log(c)

      config.multiple = multiple
      config.paramType = paramType
      config.op = op

    } else {
      console.log("no paramType by paramTypeId=" + paramTypeId + " in cacheKey=" + AllParamTypeKey + ", nor in meta")
      config.err = "请选择变量或类型和比较符"
    }
    return config
  }


  let param: Param | undefined
  if (EnableParamCategory) {
    if (categoryId && paramId) {
      const elems = TreeCache.getElementsByPathIdsInTreeFromCache(ParamCategoryKeyPrefix + domainId, [categoryId, paramId], "id")
      if (elems) {
        param = elems[1]
      } else {
        console.log("2 not found elems by path,categoryId=" + categoryId + ", paramId=" + paramId)
      }
    }
  } else {
    param = Cache.findOne(ParamKeyPrefix + domainId, paramId, "id")//Cache.findOne("param/domain/" + domainId, paramId, "id")
  }

  if (!param) param = paramInMeta

  if (!param) {
    config.err = "请选择变量和比较符"
  } else {
    const code = param.paramType.code
    const multiple = code.indexOf("Set") > 0

    let op: Opcode | undefined
    if (opId) {
      op = param.paramType.supportOps ? Cache.findOneInArray(param.paramType.supportOps, opId, "id") : undefined
      if (!op) op = Cache.findOne(OpKeyPrefix + param.paramType.id, opId, "id")
      if (!op) op = opInMeta
    }


    config =  EnableCompatipleMode? checkMetaAvailableOld(param.paramType, op) : checkMetaAvailable(op)
    config.multiple = multiple
    config.param = param
    config.op = op
  }
  return config
}


const checkMetaAvailable = (op?: Opcode) => {
  const config: OperandConfig = {}
  if (!op) return config

  config.other = op.other
  config.start = op.start
  config.end = op.end
  config.collection = op.collection
  config.e = op.e
  config.num = op.num

  return config
}



/**
 * 构建查询常量的参数
 * 优先级最高：指定的数据类型 
 * 优先级第2（若有）：Param变量记录的值域
 * 优先级第3（若有）：若是自定义类型和操作符，取操作符中的配置
 * 优先级第4：根据param或paramType中的type，根据这个type，取其基本类型和集合类型
 * 
 * @param paramTypeCodes 指定的数据类型 优先级最高
 * @param domainId 用于构建常量的domainId
 * 
 * @param param 检查Param记录的值域，若有则使用值域 优先级第2；若无值域则其类型为优先级第4
 * @param paramType 若使用mapKey的方式使用变量，则根据其类型 优先级第4
 * 
 * @param op 自定义类型和操作符时需要获取其中的配置 优先级第3
 * @param OpcodeKey 参见Opcode中的 other, start, end ,set, e, num
 * @returns 
 */
const getConstantQueryParams = (
    domainId?: number,
    paramTypeCodes?: string[],
    param?: Param,
    paramType?: ParamType,
    op?: Opcode,
    operandKey?: 'other' | 'start' | 'end' | 'collection' | 'e'
  ) => {
  //const { domainId, paramTypeCodes, param, paramType, op, opcodeKey } = props
  const constantQueryParams: ConstantQueryParams = { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }//pageSize: -1为全部加载

  //指定的数据类型 优先级最高
  if (paramTypeCodes && paramTypeCodes.length > 0) {
    constantQueryParams.typeIds = paramTypeCodes.map((e) => typeCode2Id(e)).filter((e) => e !== undefined).join(",")
    return constantQueryParams
  }

  //使用变量记录中的值域（若有的话）
  if (param) {
    if (param.valueScopeIds && param.valueScopeIds.length > 0) {
      constantQueryParams.ids = param.valueScopeIds
      return constantQueryParams
    }
  }


  //检查类型参数
  const type = param?.paramType || paramType
  if (!type) {
    console.warn("no paramType or param?.paramType")
    return constantQueryParams
  }

  const p = type2Both(type, op, operandKey)
  constantQueryParams.typeIds = p?.typeIds
  constantQueryParams.ids = p?.constantsIds

  console.log("constantQueryParams=" + JSON.stringify(constantQueryParams))
  return constantQueryParams
}

/**
 * 根据ParamType或Opcode，得到对应的typeIds（基本类型、以及集合类型），然后用于查询常量ConstantQueryParams.typeids
 * @param type 
 * @param op 
 * @param operandKey 
 * @returns 
 */
const type2Both = (type?: ParamType, op?: Opcode, operandKey?: string) => {

  if (!type) {
    console.warn("no paramType or param?.paramType")
    return undefined
  }

  let typeId, constantsIds

  if (type.isSys) {//系统类型
    //除了指定的值域和类型外，其它的都是有基本类型（包括枚举）和Set类型, 可以单选、多选和全选
    typeId = type.id
  } else {//若是自定义类型，则使用操作数中自定义的类型
    console.log("type is customize, use paramType in Opcode, type is " + type.code)
    if (!op || !operandKey) {
      console.warn("paramType is customize, should provide Opcode or key")
      return undefined
    }
    if (op.operandCfgStr && !op.operandCfg)
      op.operandCfg = JSON.parse(op.operandCfgStr)

    if (!op.operandCfg) {
      //所选现有变量，或变量mapKey以及变量类型，是自定义类型，需要通过其操作数Opcode中定义的类型选择
      console.warn("no operandCfg in Opcode")
      return undefined
    } else {
      console.log("operandKey=" + operandKey + ",opertor= ", op)
      const p: OperandConstantQueryParam | undefined = op.operandCfg[operandKey]
      typeId = p?.typeId
      constantsIds = p?.constantIds?.join(",")
      console.log("operandKey=" + operandKey + ",opertor= ", op, p)
    }
  }

  if(typeId){
    const basicTypeId = getBasicTypeId(typeId) || typeId
    const setTypeId = typeCode2Id(type.code.replaceAll("Set", "").replaceAll("Enum", "") + "Set")
    const typeIds = [basicTypeId, setTypeId].filter(e => e !== undefined)
    if (typeIds && typeIds.length > 0)
      return { typeIds: typeIds.join(","), constantsIds: constantsIds }
    else return {constantsIds: constantsIds}
  }else
    return {constantsIds: constantsIds}
}

const type2SysType = (type: ParamType, op?: Opcode, operandKey?: string) => {
  if (type.isSys) {//系统类型
    return type
  } else {//若是自定义类型，则使用操作数中自定义的类型
    if (!op || !operandKey) {
      //所选现有变量，或变量mapKey以及变量类型，是自定义类型，需要通过其操作数Opcode中定义的类型选择
      console.warn("2 paramType is customize, should provide Opcode and key")
      return undefined
    } else {
      const p: OperandConstantQueryParam | undefined = op[operandKey]
      const typeId = p?.typeId
      const basicTypeId = getBasicTypeId(typeId) || typeId
      return Cache.findOne(AllParamTypeKey, basicTypeId, "id")
    }
  }
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
// const getConstantQueryParams = (config: ParamTypeConfig, domainId?: number, param?: Param, paramType?: ParamType) => {
//   const queryParams: ConstantQueryParams = { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }//pageSize: -1为全部加载

//   if(param){
//     if (param.valueScopeIds && param.valueScopeIds.length > 0) {
//       queryParams.ids = param.valueScopeIds
//       //return queryParams
//     } else {
//       if (config.paramType && config.paramType.length > 0) {
//         queryParams.typeIds = config.paramType.map((e) => typeCode2Id(e)).filter((e) => e !== undefined).join(",")
//       } else if (config.toSetType) {//还须包括对应的枚举类型
//         const setTypeId = typeCode2Id(param.paramType.code + "Set") || param.paramType.id
//         queryParams.typeIds = [setTypeId].join(",")
//       } else if (config.toBasicType) {//还须包括对应的枚举类型
//         const basicTypeId = getBasicTypeId(param.paramType.id) || param.paramType.id
//         queryParams.typeIds = [basicTypeId].join(",")
//       } else {
//         queryParams.typeIds = [param.paramType.id].join(",")
//       }
//     }
//   }else if(paramType) {
//     if (config.paramType && config.paramType.length > 0) {
//       queryParams.typeIds = config.paramType.map((e) => typeCode2Id(e)).filter((e) => e !== undefined).join(",")
//     } else if (config.toSetType) {//还须包括对应的枚举类型
//       const setTypeId = typeCode2Id(paramType.code + "Set") || paramType.id
//       queryParams.typeIds = [setTypeId].join(",")
//     } else if (config.toBasicType) {//还须包括对应的枚举类型
//       const basicTypeId = getBasicTypeId(paramType.id) || paramType.id
//       queryParams.typeIds = [basicTypeId].join(",")
//     } else {
//       queryParams.typeIds = [paramType.id].join(",")
//     }
//   }

//   console.log("ConstantQueryParams=" + JSON.stringify(queryParams))
//   return queryParams
// }


const checkMetaAvailableOld = (paramType?: ParamType, op?: Opcode) => {
  const config: OperandConfig = {}
  if (!paramType || !op) return config
  if (paramType.code === 'Bool') {
    config.other = true
    return config
  }
  const opCode = op.code
  //console.log("opCode="+opCode)
  if (paramType.isBasic) {
    if (contains(["eq", "ne", "lt", "lte", "gt", "gte"], opCode, (e1, e2) => e1 === e2))
      config.other = true
    else if (opCode === 'between' || opCode === 'notBetween') {
      config.start = true
      config.end = true
    } else if (opCode === 'in' || opCode === 'nin')
      config.collection = true
    else {
      console.warn("basic Should NOT come here: opCode=" + opCode)
    }
  } else {
    if (opCode === 'contains' || opCode === 'notContains')
      config.e = true
    else if (opCode === 'eq' || opCode === 'containsAll' || opCode === 'anyIn' || opCode === 'allIn' || opCode === 'allNotIn') {
      config.other = true
    } else if (opCode === 'numberIn' || opCode === 'gteNumberIn' || opCode === 'lteNumberIn') {
      config.other = true
      config.num = true
    } else {
      console.warn("set Should NOT come here: opCode=" + opCode)
    }
  }
  return config
}
