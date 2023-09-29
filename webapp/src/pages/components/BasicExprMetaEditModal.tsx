import React, { useEffect, useRef, useState } from "react";
import { ModalForm, ProFormCascader, ProFormDependency, ProFormInstance, ProFormSelect, ProFormText } from "@ant-design/pro-form";
import { AllParamTypeKey, BasicExpressionMeta, ConstantQueryParams, BaseExpressionRecord, ExpressionQueryParams, Opcode, OpcodeQueryParams, OperandConfig, Param, ParamCategory, ParamCategoryQueryParams, ParamQueryParams, ParamType, ParamTypeQueryParams, OperandValueMeta, ParamOperandConfigKey, OperandConfigItem } from "../DataType";

import { TreeCache, Cache } from "@rwsbillyang/usecache"
import { asyncSelectProps2Request } from "@/myPro/MyProTableProps";
import { EnableParamCategory, Host } from "@/Config";
import { OperandValueMetaEditor } from "./OperandValueMetaEditor";
import { Space, message } from "antd";
import { operandConfigMapStr2List, type2Both, typeCode2Id } from "../utils";


const ExpressionKeyPrefix = "basicExpression/domain/"
const ParamKeyPrefix = "param/domain/"
const ParamCategoryKeyPrefix = "paramCategoryWithChildren/domain/"
const OpKeyPrefix = "op/type/"


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
  const initialMeta: BasicExpressionMeta = { _class: "Basic", operandMetaObj:{} }
  const [newExprId, setNewExprId] = useState(exprId)

  //传递值时，必须新建一份copy，否则当新建再次打开对话框时，将仍在newMeta上修改，保存时冲掉原来的值
  const [newMeta, setNewMeta] = useState(meta ? { ...meta } : {...initialMeta})
  const [opTooltip, setOpTooltip] = useState<string>()
  const [oprandConfigList, setOperandConfigList] = useState<OperandConfigItem[] | undefined>(operandConfigMapStr2List(meta?.op?.operandConfigMapStr)?.list)
  
  // console.log("BasicExprMetaEditModal, meta=", meta)
  // console.log("BasicExprMetaEditModal, newMeta=", newMeta)
  const paramCfg = oprandConfigList? Cache.findOneInArray(oprandConfigList, ParamOperandConfigKey, "name") : undefined


  const formRef = useRef<ProFormInstance>()
  useEffect(() => {
    if (newExprId) {//使用现有表达式切换，导致setNewMeta和setOpTooltip
      const expression: BaseExpressionRecord | undefined = Cache.findOne(ExpressionKeyPrefix + domainId, newExprId, "id")
      const meta: BasicExpressionMeta | undefined = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined
      console.log("=====update newMeta by newExprId=" + newExprId, meta)

      if (meta) {
        setNewMeta(meta)
        setOpTooltip(meta.op?.remark)
        //if (meta.op?.operandConfigMapStr) setOperandMap(JSON.parse(meta.op.operandConfigMapStr))
        setOperandConfigList(operandConfigMapStr2List(meta.op?.operandConfigMapStr)?.list)
      } else {
        console.log("no expression or expression.metaStr when newExprId changed")
      }

      //子组件因为使用了useState，传入的meta不能生效，故采用发送事件方式更新
      //dispatch({ type: "updateMetaValue", payload: meta })
      // if (EnableParamCategory) {
      //   formRef?.current?.setFieldValue("paramId", (meta?.paramId && meta?.param?.categoryId) ? [meta.param.categoryId, meta.paramId] : undefined)
      // } else {
      //   formRef?.current?.setFieldValue("paramId", meta?.paramId)
      // }
      formRef?.current?.setFieldValue("paramId", meta?.paramId)
      formRef?.current?.setFieldValue("paramTypeId", meta?.paramTypeId)
      formRef?.current?.setFieldValue("mapKey", meta?.mapKey)
      formRef?.current?.setFieldValue("extra", meta?.extra)
      formRef?.current?.setFieldValue("opId", meta?.opId)

      newMeta.operandMetaObj = {}
    } else {
      setOpTooltip(newMeta.op?.remark)
    }

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
        newMeta.operandMetaObj = {}
        setOperandConfigList(undefined)
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
        newMeta.operandMetaObj = {}
        setOperandConfigList(undefined)
      }

      if (v.paramTypeId && newMeta.paramTypeId != v.paramTypeId) { //paramTypeId改变
        console.log("paramTypeId reset...")
        formRef?.current?.setFieldValue("opId", undefined)

        newMeta.opId = undefined
        newMeta.operandMetaObj = {}
        setOperandConfigList(undefined)
      }

      if (v.opId && newMeta.opId != v.opId) {
        newMeta.opId = v.opId
        const paramId = formRef?.current?.getFieldValue("paramId")
        const paramTypeId = formRef?.current?.getFieldValue("paramTypeId")
        newMeta.param = getParamById(paramId, domainId, newMeta.param)
        newMeta.paramType = getParamTypeById(paramTypeId, newMeta.paramType)

        const op = getOpcodeById(v.opId, newMeta.param?.paramType.id || newMeta.paramType?.id, newMeta) 
        newMeta.op = op

        newMeta.operandMetaObj = {}
        const list = operandConfigMapStr2List(op?.operandConfigMapStr)?.list
        list?.forEach((e) => {
          const v = defaultOperandValueMeta(e)
          if(v) newMeta.operandMetaObj[e.name] = v
        })
        
        setOperandConfigList(list)
      }

    }}
    submitTimeout={2000}
    onFinish={async (values) => {
      newMeta.paramId = values.paramId
      newMeta.paramTypeId = values.paramTypeId
      newMeta.mapKey = values.mapKey
      newMeta.extra = values.extra
      newMeta.opId = values.opId
      newMeta._class = values._class

      if(!newMeta.opId){
        message.warning("没有选择操作符")
        return false
      }
      if(!oprandConfigList || oprandConfigList.length === 0){
        message.warning("没有操作数配置")
        return false
      }
      //变量本身是否必须
      if(!paramCfg || (paramCfg && paramCfg.required)){
        if (!newMeta.paramId && (!newMeta.mapKey || newMeta.paramTypeId === undefined)) {
          console.log("newMeta=", newMeta)
          message.warning("没有配置变量")
          return false
        }
      }
      
      if (oprandConfigList.length > 0) {
        for (let i=0; i< oprandConfigList.length; i++) {
          const e = oprandConfigList[i]
          const operandMeta = newMeta.operandMetaObj[e.name]
          if (e.required && (!operandMeta || (operandMeta.jsonValue?.value === undefined && !operandMeta.paramId))) {
            message.warning(e.label + ": 操作数没有值")
            return false
          }
        }
      }
      

      //有值，但没有相关操作数配置，则删除该值
      for (var k in newMeta.operandMetaObj) {
        if (oprandConfigList.length > 0){
          const cfg = Cache.findOneInArray(oprandConfigList, k, "name")
          if(!cfg || (cfg && !cfg.enable)){
            delete newMeta.operandMetaObj[k]
            //console.log("delete " + k + " in valueMap: "+ ret + ", hasK="+ newMeta.operandValueMap.has(k))
          } 
        }
      }
      console.log("onDone=", newMeta)
      onDone(newMeta, newExprId)
      return true
    }}>


    <ProFormSelect
      name="exprId"
      label="现有基本表达式"
      hidden={cannotChooseOne}
      tooltip="使用现有的已创建过的基本表达式"
      initialValue={newExprId}
      request={cannotChooseOne ? undefined : () => asyncSelectProps2Request<BaseExpressionRecord, ExpressionQueryParams>({
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
              tooltip="已创建过的变量、变量二选一"
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
              label="已创建变量"
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
            label="或变量"
            tooltip="变量三要素：类型、索引键、附属信息"
            width="sm"
            name="paramTypeId"
            disabled={!!exprId || !!paramId}
            initialValue={newMeta?.paramTypeId}
            request={() => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
              key: AllParamTypeKey,//不提供key，则不缓存
              url: `${Host}/api/rule/composer/list/paramType`,
              query: { pagination: { pageSize: -1, sKey: "id", sort: -1 } },//pageSize: -1为全部加载
              convertFunc: (item) => { return { label: item.label, value: item.id } }
            })} />
          <ProFormText
            width="sm"
            name="mapKey"
            fieldProps={{placeholder:"索引键"}}
            initialValue={newMeta?.mapKey}
            disabled={!!exprId || !!paramId}
          />
           <ProFormText
            width="sm"
            name="extra"
            fieldProps={{placeholder:"附属信息"}}
            initialValue={newMeta.param?.extra || newMeta.extra}
            disabled={!!exprId || !!paramId}
          />
        </Space.Compact>

      }}</ProFormDependency>

    <ProFormDependency name={["exprId", "paramId", "paramTypeId"]}>
      {({ exprId, paramId, paramTypeId }) => {
        //console.log("update op: exprId=" + exprId + ", paramId=" + paramId + ", paramTypeId=" + paramTypeId )
        return <ProFormSelect
          label="操作符"
          name="opId"
          initialValue={newMeta?.opId}
          tooltip={opTooltip}
          dependencies={["exprId", "paramId", "paramTypeId"]}//不可少，否则request不重新请求
          disabled={!!exprId}
          request={() => {
            //console.log("op request: exprId=" + exprId + ", paramId=" + paramId + ", paramTypeId=" + paramTypeId )
            if (paramId) {
              if (EnableParamCategory) {
                if (paramId && paramId.length > 1) {
                  return asyncGetOpOptions({ paramId, domainId, paramInMeta: newMeta.param, paramTypeInMeta: newMeta.paramType })
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
         //先onValuesChange通知，后执行到此处
         //console.log("update OperandValueMeta: exprId=" + exprId + ", paramId=" + paramId + ", paramTypeId=" + paramTypeId + ", opId=" + opId)

        return oprandConfigList ? <>
          {oprandConfigList.filter(e => e.enable).map((e) => <OperandValueMetaEditor key={e.name}
            paramType={adjustParamType(e, newMeta.param, newMeta.paramType)}
            operandConfig={e}
            constantQueryParams={getConstantQueryParams(e, newMeta.param, newMeta.paramType, domainId)}
            domainId={domainId}
            disabled={!!exprId}
            value={newMeta.operandMetaObj[e.name]}
            onChange={(v) => {
              newMeta.operandMetaObj[e.name] = v
              setNewMeta({...newMeta})
            }} />)}
        </> : <div>请选择</div>
      }}
    </ProFormDependency>

  </ModalForm>
}



/**
 * 根据operandConfig生成缺省的OperandValueMeta
 * @param operandConfig 
 */
const defaultOperandValueMeta = (operandConfig: OperandConfig) => {
   const operandMeta: OperandValueMeta = {}
  if(operandConfig.defaultOperandValueType) {
    operandMeta.valueType = operandConfig.defaultOperandValueType
    return operandMeta
  }
  if(operandConfig.selectOptions && operandConfig.selectOptions.length){
    operandMeta.valueType = 'Constant'
    operandMeta.constantIds = operandConfig.defaultSelect
    operandMeta.jsonValue = {_class: "String", value: operandConfig.defaultSelect}
    return operandMeta
  }
  if(operandConfig.contantIds || operandConfig.typeCode){
    operandMeta.valueType = 'Constant'
    return operandMeta
  }
  return undefined
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
    paramId?: number | number[],
    paramInMeta?: Param,
    paramTypeId?: number,
    paramTypeInMeta?: ParamType,
    domainId?: number
  }) => {
  //console.log("asyncGetOpOptions：domainId=" + domainId + ", paramId=" + paramId)
  const { paramId, paramInMeta, paramTypeId, paramTypeInMeta, domainId } = props

  if (paramTypeId) {
    const paramType: ParamType | undefined = getParamTypeById(paramTypeId, paramTypeInMeta)
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
            return { label: item.label, value: item.id }
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

  const param: Param | undefined = getParamById(paramId, domainId, paramInMeta)

  if (!param) {
    console.warn("No param in cache, nor in meta, no ops return")
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
        return { label: item.label, value: item.id }
      }
    })
  }
}

/**
 * 调整类型，配置中指定了类型，则使用配置的，否则fallback到变量类型
 */
const adjustParamType = (operandConfig: OperandConfig, param?: Param, paramType?: ParamType) => {
  if (operandConfig.typeCode) {//配置中指定了类型，则使用配置的，否则fallback到变量类型
    return getParamTypeById(typeCode2Id(operandConfig.typeCode), param?.paramType || paramType)
  } else
    return param?.paramType || paramType
}

//       let op: Opcode | undefined
//       if (opId) {
//         op = paramType.supportOps ? Cache.findOneInArray(paramType.supportOps, opId, "id") : undefined
//         if (!op) op = Cache.findOne(OpKeyPrefix + paramType.id, opId, "id")
//         if (!op) op = opInMeta
//       }
/**
 * 根据id从缓存中获取ParamType
 * @param paramTypeId 
 * @param defaultValue 
 * @returns 
 */
const getOpcodeById = (opId?: number, paramTypeId?: number, meta?: BasicExpressionMeta) => {
  let opcode: Opcode | undefined = Cache.findOne(OpKeyPrefix + paramTypeId, opId, "id")
  opcode = Cache.findOneInArray(getParamTypeById(paramTypeId, meta?.paramType)?.supportOps || [],opId, "id") 
  if (!opcode) opcode = meta?.op
  return opcode
}
/**
 * 根据id从缓存中获取ParamType
 * @param paramTypeId 
 * @param defaultValue 
 * @returns 
 */
const getParamTypeById = (paramTypeId?: number, defaultValue?: ParamType) => {
  let paramType: ParamType | undefined = Cache.findOne(AllParamTypeKey, paramTypeId, "id")
  if (!paramType) paramType = defaultValue
  return paramType
}

/**
 * 根据id从缓存中获取Param
 * @param paramId 
 * @param domainId 
 * @param defaultValue 
 * @returns 
 */
const getParamById = (paramId?: number | number[], domainId?: number, defaultValue?: Param) => {
  if (!paramId) return undefined

  let param: Param | undefined
  if (EnableParamCategory) {
    if (Array.isArray(paramId) && paramId.length === 2) {
      const elems = TreeCache.getElementsByPathIdsInTreeFromCache(ParamCategoryKeyPrefix + domainId, paramId, "id")
      if (elems) {
        param = elems[1]
      } else {
        console.warn("not found elems by path")
      }
    } else {
      console.warn("invalid paramId, it's not array with length==2, paramId=", paramId)
    }
  } else {
    param = Cache.findOne(ParamKeyPrefix + domainId, paramId as number, "id")//Cache.findOne("param/domain/" + domainId, paramId, "id")
  }
  return param || defaultValue
}

/**
 * 构建查询常量的参数
 * 优先级最高：operandConfig指定的值域
 * 优先级第2（若有）：Param变量记录的值域
 * 优先级第3（若有）：operandConfig指定的数据类型，取其基本类型和集合类型
 * 优先级第4：根据param或paramType中的的数据类型，取其基本类型和集合类型
 * 
 * @param operandConfig 指定的数据类型 优先级最高
 * @param param 检查Param记录的值域，若有则使用值域 优先级第2；若无值域则其类型为优先级第4
 * @param paramType 若使用mapKey的方式使用变量，则根据其类型 优先级第4
 * @param domainId 用于构建常量的domainId
 * @returns 
 */
const getConstantQueryParams = (
  operandConfig: OperandConfig,
  param?: Param,
  paramType?: ParamType,
  domainId?: number
) => {
  //const { domainId, paramTypeCodes, param, paramType, op, opcodeKey } = props
  const constantQueryParams: ConstantQueryParams = { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }//pageSize: -1为全部加载

  //指定的值域优先级最高
  if (operandConfig.contantIds && operandConfig.contantIds.length > 0) {
    constantQueryParams.ids = operandConfig.contantIds.join(',')
  }

  //再次，使用变量中的值域（若有的话）
  if (param) {
    if (param.valueScopeIds && param.valueScopeIds.length > 0) {
      constantQueryParams.ids = param.valueScopeIds
      return constantQueryParams
    }
  }

  //其次，配置的数据类型typeCode，比如变量类型为集合，而指定的参数num为Int，应优先使用配置中指定的
  if (operandConfig.typeCode) {
    constantQueryParams.typeIds = type2Both(typeCode2Id(operandConfig.typeCode))
    return constantQueryParams
  }

  //最后，使用变量类型：基本类型以及容器集合类型
  const type = param?.paramType || paramType
  if (!type) {
    console.warn("no paramType or param?.paramType")
    return constantQueryParams
  }

  constantQueryParams.typeIds = type2Both(type.id)

  //console.log("constantQueryParams=" + JSON.stringify(constantQueryParams))
  return constantQueryParams
}


// interface OperandConfig {
//   err?: string
//   other?: boolean,
//   start?: boolean,
//   end?: boolean,
//   e?: boolean,
//   collection?: boolean,
//   num?: boolean,
//   multiple?: boolean,
//   param?: Param,
//   paramType?: ParamType,
//   op?: Opcode
// }


// /**
//  * 获取操作数配置OperandConfig，如other，set, start,end, e, num等是否可见，以及更新后的param或paramType， Opcode
//  * param或paramType根据其id从缓存中查找，若找不到，则使用meta中提供
//  * 
//  * 使用paramType和Opcode返回other，set, start,end, e, num等是否可见，顺便返回更新后的paramType和Opcode以及paramType
//  * 
//  * @param domainId cacheKey中加载param时需要
//  * @param categoryId 变量分类，treecache中需要
//  * @param paramId 依据paramId（即param）加载操作符
//  * @param paramInMeta 来自meta，当使用categoryId/paramId从缓存中获取Param失败时使用
//  * @param opId 用于获取更新的Opcode
//  * @param opInMeta 来自meta，当使用opId从缓存中获取Opcode失败时使用
//  * @param paramTypeId 依据paramTypeId（即paramType））加载操作符 与paramId&categoryId 二选一
//  * @param paramTypeInMeta 来自meta，当使用paramTypeId从缓存中获取Param失败时使用
//  * 
//  * 最终使用paramType和Opcode返回other，set, start,end, e, num等是否可见，顺便返回更新后的paramType和Opcode以及paramType
//  * @returns 返回Opcode列表
//  */
// const getValueMapParam = (props: {
//   domainId?: number,

//   categoryId?: number,
//   paramId?: number,
//   paramInMeta?: Param,

//   opId?: number,
//   opInMeta?: Opcode

//   paramTypeId?: number,
//   paramTypeInMeta?: ParamType,
// }) => {
//   let config: OperandConfig = {}
//   const { domainId, paramId, opId, categoryId, paramTypeId, paramInMeta, paramTypeInMeta, opInMeta } = props

//   if (paramTypeId) {
//     let paramType: ParamType | undefined = Cache.findOne(AllParamTypeKey, paramTypeId, "id")
//     if (!paramType) paramType = paramTypeInMeta
//     if (paramType) {
//       const code = paramType.code
//       const multiple = code.indexOf("Set") > 0

//       let op: Opcode | undefined
//       if (opId) {
//         op = paramType.supportOps ? Cache.findOneInArray(paramType.supportOps, opId, "id") : undefined
//         if (!op) op = Cache.findOne(OpKeyPrefix + paramType.id, opId, "id")
//         if (!op) op = opInMeta
//       }

//       config =  EnableCompatipleMode? checkMetaAvailableOld(paramType, op) : checkMetaAvailable(op)

//       //console.log(c)

//       config.multiple = multiple
//       config.paramType = paramType
//       config.op = op

//     } else {
//       console.log("no paramType by paramTypeId=" + paramTypeId + " in cacheKey=" + AllParamTypeKey + ", nor in meta")
//       config.err = "请选择变量或类型和比较符"
//     }
//     return config
//   }


//   let param: Param | undefined
//   if (EnableParamCategory) {
//     if (categoryId && paramId) {
//       const elems = TreeCache.getElementsByPathIdsInTreeFromCache(ParamCategoryKeyPrefix + domainId, [categoryId, paramId], "id")
//       if (elems) {
//         param = elems[1]
//       } else {
//         console.log("2 not found elems by path,categoryId=" + categoryId + ", paramId=" + paramId)
//       }
//     }
//   } else {
//     param = Cache.findOne(ParamKeyPrefix + domainId, paramId, "id")//Cache.findOne("param/domain/" + domainId, paramId, "id")
//   }

//   if (!param) param = paramInMeta

//   if (!param) {
//     config.err = "请选择变量和比较符"
//   } else {
//     const code = param.paramType.code
//     const multiple = code.indexOf("Set") > 0

//     let op: Opcode | undefined
//     if (opId) {
//       op = param.paramType.supportOps ? Cache.findOneInArray(param.paramType.supportOps, opId, "id") : undefined
//       if (!op) op = Cache.findOne(OpKeyPrefix + param.paramType.id, opId, "id")
//       if (!op) op = opInMeta
//     }


//     config =  EnableCompatipleMode? checkMetaAvailableOld(param.paramType, op) : checkMetaAvailable(op)
//     config.multiple = multiple
//     config.param = param
//     config.op = op
//   }
//   return config
// }


// const checkMetaAvailable = (op?: Opcode) => {
//   const config: OperandConfig = {}
//   if (!op || !op.operandMapStr){
//     console.warn("no op or no op.operandMapStr, return empty OperandConfig,  op=", op)
//      return config
//   }

//   const map: Map<string, OperandConfig> = JSON.parse(op.operandMapStr)

//   config.other = map["ot"]
//   config.start = op.start
//   config.end = op.end
//   config.collection = op.collection
//   config.e = op.e
//   config.num = op.num

//   return config
// }




// /**
//  * 在构建基本表达式时，为参数变量param选择常量时，会有不同
//  *
//  * 变量：可以是任何类型
//  * 而other、start、end、set、e、num等操作数选择常量时：
//  * 若变量有值域，则仅使用其值域常量（即只有其对应枚举类型）
//  *
//  * 若没有，则根据param的类型以及other、start、end、set、e、num等情形做相应变换
//  * 对于num永远使用指定的Int和Long类型
//  * 如何变换则由ParamTypeConfig指定
//  *
//  *
//  * @param param
//  * @param paramTypeCode 如果不提供将使用param的类型，因为有的比较符要求操作数类型与自己并不一致，如集合是否包含某项，某变量是否在集合中，交集数量等
//  * @returns 返回ConstantQueryParams，其中包含了domainId，pagination, 以及ids或typeIds等字段
//  */
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