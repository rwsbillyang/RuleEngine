import React, { useRef, useState } from "react";
import { ModalForm, ProFormCascader, ProFormDependency, ProFormInstance, ProFormSelect, ProFormText } from "@ant-design/pro-form";
import { AllParamTypeKey, BasicExpressionMeta, ConstantQueryParams, BaseExpressionRecord, ExpressionQueryParams, Opcode, OpcodeQueryParams, OperandConfig, Param, ParamCategory, ParamCategoryQueryParams, ParamQueryParams, ParamType, ParamTypeQueryParams, OperandValueMeta, ParamOperandConfigKey, OperandConfigItem } from "../DataType";

import { TreeCache, Cache, deepCopy, ArrayUtil } from "@rwsbillyang/usecache"
import { asyncSelect2Request, asyncSelectProps2Request } from "@/myPro/MyProTableProps";
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
 * @param cannotChooseOne 若为true则不能选择现有的表达式，只能新建或编辑一个BasicExpressionMeta，
 * 个别情况下使用，多数情况下不使用表示可以在现有的基础上进行简单修改
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
  const initialMeta: BasicExpressionMeta = { _class: "Basic", operandMetaObj: {} }
  const [newExprId, setNewExprId] = useState(exprId)

  //传递值时，必须新建一份copy，否则当新建再次打开对话框时，将仍在newMeta上修改，保存时冲掉原来的值
  const [newMeta, setNewMeta] = useState(deepCopy(meta || initialMeta) as BasicExpressionMeta)
  const [opTooltip, setOpTooltip] = useState<string>()
  const [oprandConfigList, setOperandConfigList] = useState<OperandConfigItem[] | undefined>(operandConfigMapStr2List(meta?.op?.operandConfigMapStr)?.list)

  const paramCfg = oprandConfigList ? ArrayUtil.findOne(oprandConfigList, ParamOperandConfigKey, "name") : undefined
  const formRef = useRef<ProFormInstance>()

  //console.log("BasicExprMetaEditModal, meta=", meta)
  //console.log("BasicExprMetaEditModal, newMeta=", newMeta)




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

      const form = formRef?.current

      //在选择了现有表达式或者现有变量后，可在其基础上再做修改，像在模板上修改一样，更方便地创建规则条件
      //因而在重置现有表达式或现有变量时，也不能再修改其它字段

      //表达式切换  清空（if(newExprId && !v?.exprId)）不做处理
      if (v.exprId && newExprId != v.exprId) {
        //console.log("===== exprId changed======")
        const expression: BaseExpressionRecord | undefined = Cache.findOne(ExpressionKeyPrefix + domainId, v.exprId, "id")
        const meta: BasicExpressionMeta | undefined = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined

        if (!meta) {
          console.log("no expression or expression.metaStr when newExprId changed")
        }

        form?.setFieldValue("paramId", meta?.paramId)
        form?.setFieldValue("paramTypeId", meta?.paramTypeId)
        form?.setFieldValue("mapKey", meta?.mapKey)
        form?.setFieldValue("extra", meta?.extra)
        form?.setFieldValue("opId", meta?.opId)

        setNewExprId(v.exprId)
        setNewMeta(meta || { ...initialMeta })
        setOperandConfigList(operandConfigMapStr2List(meta?.op?.operandConfigMapStr)?.list)
        setOpTooltip(meta?.op?.remark)
      }

      //变量切换
      if (v.paramId && newMeta.paramId != v.paramId) { //paramId改变
        // console.log("paramId changed...")
        const param = getParamById(v.paramId, domainId, newMeta.param)
        newMeta.paramId = v.paramId
        newMeta.param = param
        newMeta.paramTypeId = param?.paramType?.id
        newMeta.paramType = param?.paramType
        newMeta.mapKey = param?.mapKey
        newMeta.extra = param?.extra
        newMeta.opId = undefined
        newMeta.op = undefined
        newMeta.operandMetaObj = {}

        form?.setFieldValue("paramTypeId", param?.paramType?.id)
        form?.setFieldValue("mapKey", param?.mapKey)
        form?.setFieldValue("extra", param?.extra)
        form?.setFieldValue("opId", undefined)

        setOpTooltip(undefined)
        setOperandConfigList(undefined)
      }
      // else if(newMeta.paramId && !v.paramId){//不能准确判断清空，其它字段情况也符合该条件
      //   delete newMeta.paramId
      //   delete newMeta.param
      // }

      //变量类型切换
      if (v.paramTypeId && newMeta.paramTypeId != v.paramTypeId) { //paramTypeId改变
        console.log("paramTypeId changed...")
        const paramType = getParamTypeById(v.paramTypeId, newMeta.paramType)
        newMeta.paramType = paramType
        newMeta.paramTypeId = v.id

        form?.setFieldValue("exprId", undefined)
        form?.setFieldValue("paramId", undefined)
        form?.setFieldValue("opId", undefined)
        
        newMeta.paramId = undefined
        newMeta.param = undefined
        
        newMeta.opId = undefined
        newMeta.op = undefined

        newMeta.operandMetaObj = {}
        setNewExprId(undefined)
        setOpTooltip(undefined)
        setOperandConfigList(undefined)
      }

      //操作符切换
      if (v.opId && newMeta.opId != v.opId) {
           // console.log("opId changed...")
           const op = getOpcodeById(v.opId, newMeta.param?.paramType.id || newMeta.paramType?.id, newMeta)
           newMeta.opId = v.opId
           newMeta.op = op
     
           newMeta.operandMetaObj = {}
           const list = operandConfigMapStr2List(op?.operandConfigMapStr)?.list
           list?.forEach((e) => {
             const v = defaultOperandValueMeta(e)
             if (v) newMeta.operandMetaObj[e.name] = v
           })
           setOperandConfigList(list)
           setOpTooltip(op?.remark)
      }

    }}
    submitTimeout={2000}
    onFinish={async (values) => {
      newMeta.paramId = values.paramId
      if(!values.paramId){//因valueChange里面不能准确判断是否清除了paramId，此处补上，若没有了paramId，param也无意义
        newMeta.param = undefined
      }

      newMeta.paramTypeId = values.paramTypeId
      newMeta.mapKey = values.mapKey
      
      newMeta.extra = values.extra
      if(values.extra === "") delete newMeta.extra

      newMeta.opId = values.opId
      newMeta._class = values._class

      if (!newMeta.paramTypeId || !newMeta.mapKey) {
        console.log("newMeta=", newMeta)
        message.warning("没有选择操作数：类型或者key")
        return false
      }
      
      if(!newMeta.paramType) newMeta.paramType = getParamTypeById(newMeta.paramTypeId)

      if (!newMeta.opId) {
        console.log("newMeta=", newMeta)
        message.warning("没有选择操作符")
        return false
      }
      if (!oprandConfigList || oprandConfigList.length === 0) {
        console.log("newMeta=", newMeta)
        message.warning("没有操作数配置")
        return false
      }
      //变量本身是否必须
      if (!paramCfg || (paramCfg && paramCfg.required)) {
        if (!newMeta.paramId && (!newMeta.mapKey || newMeta.paramTypeId === undefined)) {
          console.log("newMeta=", newMeta)
          message.warning("没有配置变量")
          return false
        }
      }

      if (oprandConfigList.length > 0) {
        for (let i = 0; i < oprandConfigList.length; i++) {
          const e = oprandConfigList[i]
          const operandMeta = newMeta.operandMetaObj[e.name]
          if (e.required && (!operandMeta || (operandMeta.jsonValue?.raw === undefined && !operandMeta.paramId))) {
            message.warning(e.label + ": 操作数没有值")
            return false
          }
        }
      }

      //有值，但没有相关操作数配置，则删除该值
      for (var k in newMeta.operandMetaObj) {
        if (oprandConfigList.length > 0) {
          const cfg = ArrayUtil.findOne(oprandConfigList, k, "name")
          if (!cfg || (cfg && !cfg.enable)) {
            delete newMeta.operandMetaObj[k]
            //console.log("delete " + k + " in valueMap: "+ ret + ", hasK="+ newMeta.operandValueMap.has(k))
          }
        }
      }
      //console.log("onDone=", newMeta)
      onDone(deepCopy(newMeta), newExprId)//deepcopy 新值传递给调用者
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
              //disabled={!!exprId}
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
              //disabled={!!exprId}
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
            //disabled={!!exprId || !!paramId}
            initialValue={newMeta?.paramTypeId}
            request={() => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
              key: AllParamTypeKey,//不提供key，则不缓存
              url: `${Host}/api/rule/composer/list/paramType`,
              query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
              convertFunc: (item) => { return { label: item.label, value: item.id } }
            })} />
          <ProFormText
            width="sm"
            name="mapKey"
            fieldProps={{ placeholder: "索引键" }}
            initialValue={newMeta?.mapKey}
          //disabled={!!exprId || !!paramId}
          />
          <ProFormText
            width="sm"
            name="extra"
            fieldProps={{ placeholder: "附属信息" }}
            initialValue={newMeta.param?.extra || newMeta.extra}
          //disabled={!!exprId || !!paramId}
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
          // disabled={!!exprId}
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
                //console.log("reset? not choose paramId or paramTypeId")
                return asyncGetOpOptions({ domainId, paramTypeInMeta: newMeta.paramType, paramInMeta: newMeta.param })
              } else {
                return asyncGetOpOptions({ paramTypeId, domainId, paramTypeInMeta: newMeta.paramType, paramInMeta: newMeta.param })
              }
            }
          }}
        />
      }}
    </ProFormDependency>

    <ProFormDependency name={["exprId", "paramId", "paramTypeId", "opId"]} shouldUpdate>
      {({ exprId, paramId, paramTypeId, opId }) => {
        //先onValuesChange通知，后执行到此处
 
        if (!oprandConfigList) return <div>请选择</div>
        const keyPrefix = `${exprId}-${paramId}-${paramTypeId}-${opId}-`
        return <>
          {oprandConfigList.filter(e => e.enable).map((e) => {
            const type = newMeta.param?.paramType || newMeta.paramType
            //console.log("keyPrefix="+keyPrefix+",constantQueryParam=",constantQueryParam)
            return type? <OperandValueMetaEditor key={keyPrefix + e.name}
              paramType={type}
              operandConfig={e}
              constantQueryParams={getConstantQueryParams(e, newMeta.param, newMeta.paramType, domainId)}
              domainId={domainId}
              //disabled={!!exprId}
              value={newMeta.operandMetaObj[e.name]}
              onChange={(v) => {
                newMeta.operandMetaObj[e.name] = v
                setNewMeta({ ...newMeta })
              }} />: <div>no type</div>
          })}
        </> 
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
  if (operandConfig.defaultOperandValueType) {
    operandMeta.valueType = operandConfig.defaultOperandValueType
    return operandMeta
  }
  if (operandConfig.selectOptions && operandConfig.selectOptions.length) {
    operandMeta.valueType = 'Constant'
    operandMeta.constantIds = operandConfig.defaultSelect
    operandMeta.jsonValue = { _class: "String", raw: operandConfig.defaultSelect }
    return operandMeta
  }
  if (operandConfig.contantIds || operandConfig.typeCode) {
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
  //console.log("asyncGetOpOptions：domainId=" + props.domainId + ", paramId=" + props.paramId)
  const { paramId, paramInMeta, paramTypeId, paramTypeInMeta, domainId } = props

  if (paramTypeId) {
    return getSupportOpsByParamTypeId(paramTypeId, paramTypeInMeta)
  }

  if (!paramId && !paramInMeta) {
    //console.log("new enter? so no ops return")
    return new Promise(resolve => resolve([]))
  }

  const param: Param | undefined = getParamById(paramId, domainId, paramInMeta)

  if (!param) {
    console.warn("No param in cache, nor in meta, no ops return")
    return new Promise(resolve => resolve([]))
  }

  if(param.paramType.id){
    return getSupportOpsByParamTypeId(param.paramType.id, paramTypeInMeta)
  }else{
    console.warn("No param.paramType.id, no ops return")
    return new Promise(resolve => resolve([]))
  }

}

const getSupportOpsByParamTypeId = (paramTypeId: number, paramTypeInMeta?:ParamType) => {
  const paramType: ParamType | undefined = getParamTypeById(paramTypeId, paramTypeInMeta)
    if (paramType) {
      const supportOps = paramType.supportOps
      if (supportOps) {
        //console.log("get supportOps from paramType.supportOps:",paramType.supportOps)
        return new Promise(resolve => resolve(supportOps.map((item) => { return { label: item.label, value: item.id } })))
      } else {
        if(paramType.supportOpIds){
          return asyncSelect2Request<Opcode>(`${Host}/api/rule/composer/getByIds/opcode`,
          OpKeyPrefix + paramTypeId, {data: paramType.supportOpIds}, "POST",
           (item) => {
              return { label: item.label, value: item.id }
            }
          )
        }else{
          return asyncSelectProps2Request<Opcode, OpcodeQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
            key: OpKeyPrefix + paramTypeId,//不提供key，则不缓存，每次均从远程请求
            url: `${Host}/api/rule/composer/list/opcode`,
            query: { ids: paramType.supportOpIds, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
            convertFunc: (item) => {
              return { label: item.label, value: item.id }
            }
          })
        }
        
      }
    } else {
      console.warn("MapKey+paramTypeId mode: no paramType by paramTypeId=" + paramTypeId + " in cacheKey=" + AllParamTypeKey + ", nor in meta")
      return new Promise(resolve => resolve([]))
    }
}


/**
 * 根据id从缓存中获取ParamType
 * @param paramTypeId 
 * @param defaultValue 
 * @returns 
 */
const getOpcodeById = (opId?: number, paramTypeId?: number, meta?: BasicExpressionMeta) => {
  let opcode: Opcode | undefined = Cache.findOne(OpKeyPrefix + paramTypeId, opId, "id")
  opcode = ArrayUtil.findOne(getParamTypeById(paramTypeId, meta?.paramType)?.supportOps || [], opId, "id")
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
      const elems: Param[] | undefined = TreeCache.getElementsByPathIdsInTreeFromCache(ParamCategoryKeyPrefix + domainId, paramId, "id")
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

 // console.log("getConstantQueryParams: operandConfig", operandConfig)
 // console.log("getConstantQueryParams: param",  param)
 // console.log("getConstantQueryParams: paramType", paramType)

  //指定的值域优先级最高
  if (operandConfig.contantIds && operandConfig.contantIds.length > 0) {
    constantQueryParams.ids = operandConfig.contantIds.join(',')
    return constantQueryParams
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

