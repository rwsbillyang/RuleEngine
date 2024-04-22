import React, {  useRef, useState } from "react";
import { ModalForm, ProFormCascader, ProFormInstance, ProFormSelect, ProFormText } from "@ant-design/pro-form";
import { AllParamTypeKey, BasicExpressionMeta, ConstantQueryParams, BaseExpressionRecord, ExpressionQueryParams, Opcode, OperandConfig, Param, ParamCategory, ParamCategoryQueryParams, ParamQueryParams, ParamType, ParamTypeQueryParams, OperandMeta, OperandConfigItem } from "../DataType";

import { TreeCache, Cache, deepCopy, ArrayUtil } from "@rwsbillyang/usecache"
import { asyncSelectProps2Request } from "easy-antd-pro";
import { EnableParamCategory, Host } from "@/Config";
import { OperandValueMetaEditor } from "./OperandValueMetaEditor";
import { Space, message } from "antd";
import { operandConfigMapStr2List, type2Both, typeCode2Id } from "../utils";
import { DefaultOptionType } from "antd/lib/select";



const ExpressionKeyPrefix = "basicExpression/domain/"
const ParamKeyPrefix = "param/domain/"
const ParamCategoryKeyPrefix = "paramCategoryWithChildren/domain/"
const OpKeyPrefix = "op/type/"


/***
 * v2: 因BasicExpressionMeta中删除了param 以及paramType，及部分op字段，导致编辑时，opcode选项以及operandCfgList等原始元信息
 * 缺失，若AllParamType加载完毕，再加载opcode选项及operandCfgList就能从缓存中正确获取。
 * 可是，原版本中无法控制AllParamType加载完后再加载opcode选项及operandCfgList
 * 
 * 
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
export const BasicExprMetaEditModalV2: React.FC<{
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

  //const paramCfg = oprandConfigList ? ArrayUtil.findOne(oprandConfigList, ParamOperandConfigKey, "name") : undefined
  const formRef = useRef<ProFormInstance>()

  const paramType = newMeta.param?.paramType || newMeta.paramType

  //console.log("BasicExprMetaEditModal, meta=", meta)
  //console.log("BasicExprMetaEditModal, newMeta=", newMeta)
  //console.log("BasicExprMetaEditModal, paramType=", paramType)
  //console.log("BasicExprMetaEditModal, oprandConfigList=", oprandConfigList)

  //const [paramTypeOptions, setParamTypeOptions] = useState<DefaultOptionType[]>()
  const [opcodeOptions, setOpcodeOptions] = useState<DefaultOptionType[]>()

  const ref = useRef<{paramTypeList?: ParamType[], paramList?: Param[]}>({})

  const updateOpAndOperandsIfParamTypeChanged = () => {
    const list = ref.current.paramTypeList
    if(!list || list.length === 0){
      console.log("no paramTypeList, please wait until load it finished")
    }else{
      const paramType2 =  getParamTypeById(list, newMeta.paramTypeId) || getParamById(ref.current.paramList, newMeta.paramId)?.paramType
      if(paramType2){
        newMeta.paramType = paramType2
        newMeta.type = paramType2.code
        if(paramType2.supportOps){
          setOpcodeOptions(paramType2.supportOps.map((item) => { return { label: item.label, value: item.id } }))
  
          const op: Opcode | undefined = ArrayUtil.findOne(paramType2.supportOps, newMeta.opId, "id")
          if (op) {
            const list = operandConfigMapStr2List(op.operandConfigMapStr)?.list
            setOperandConfigList(list)

            if(meta?.operandMetaObj){
              newMeta.operandMetaObj = meta.operandMetaObj
            }else{
              if(!newMeta.operandMetaObj){
                newMeta.operandMetaObj = {}
                list?.forEach((e) => {
                  const v = defaultOperandValueMeta(e)
                  if (v) newMeta.operandMetaObj[e.name] = v
                })
              }
            }
          }else{
            console.log("1.updateOpAndOperandsIfParamTypeChanged: not found op,  newMeta.opId="+ newMeta.opId)
          }
        }else{
          console.log("2.updateOpAndOperandsIfParamTypeChanged: no paramType.supportOps in paramType:", paramType)
        }
      }else{
        console.log("3.updateOpAndOperandsIfParamTypeChanged: not found paramType, newMeta.paramTypeId=" + newMeta.paramTypeId)
      }
    }
  }



  return <ModalForm
    formRef={formRef}
    layout="horizontal"
    title={title || "编辑基本表达式"}
    trigger={<a>{triggerName || "编辑"}</a>}
    omitNil={false} //去掉将不能清除数据，因为需要undfined来清除掉旧数据
    modalProps={{
      destroyOnClose: false,
    }}
    onValuesChange={(v) => {
       console.log("onValuesChange:" + JSON.stringify(v))

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

        newMeta.paramId = meta?.paramId
        const param = getParamById(ref.current.paramList, meta?.paramId, domainId, meta?.param)
        newMeta.param = param

        newMeta.paramTypeId = meta?.paramTypeId || param?.paramType?.id
        newMeta.paramType = getParamTypeById(ref.current.paramTypeList, newMeta.paramTypeId, meta?.paramType || param?.paramType) 
        newMeta.type = param?.paramType?.code || newMeta.paramType?.code

        newMeta.mapKey = meta?.mapKey || param?.mapKey
        newMeta.extra = meta?.extra || param?.extra
        newMeta.opId = meta?.opId
        newMeta.op = meta?.op
        
        

        form?.setFieldValue("paramId", newMeta?.paramId)
        form?.setFieldValue("paramTypeId", newMeta?.paramTypeId)
        form?.setFieldValue("mapKey", newMeta?.mapKey)
        form?.setFieldValue("extra", newMeta?.extra)
        form?.setFieldValue("opId", newMeta?.opId)

        newMeta.operandMetaObj = meta?.operandMetaObj || {}
    
        updateOpAndOperandsIfParamTypeChanged() //设置operandCfgList和operands值
       // console.log("exprId changed: newMeta=", newMeta)

        setNewExprId(v.exprId)
        setNewMeta({...newMeta} || { ...initialMeta })
    
        
        setOpTooltip(meta?.op?.remark)
      }

      //变量切换
      if (v.paramId && newMeta.paramId != v.paramId) { //paramId改变
        // console.log("paramId changed...")
        const param = getParamById(ref.current.paramList, v.paramId, domainId, newMeta.param)
        newMeta.paramId = v.paramId
        newMeta.param = param
        newMeta.paramTypeId = param?.paramType?.id
        newMeta.paramType = param?.paramType
        newMeta.type = param?.paramType?.code
        newMeta.mapKey = param?.mapKey
        newMeta.extra = param?.extra
        newMeta.opId = undefined
        newMeta.op = undefined
        newMeta.operandMetaObj = {}

        form?.setFieldValue("paramTypeId", param?.paramType?.id)
        form?.setFieldValue("mapKey", param?.mapKey)
        form?.setFieldValue("extra", param?.extra)
        form?.setFieldValue("opId", undefined)

        updateOpAndOperandsIfParamTypeChanged()
        setOpTooltip(undefined)
        
      }
      // else if(newMeta.paramId && !v.paramId){//不能准确判断清空，其它字段情况也符合该条件
      //   delete newMeta.paramId
      //   delete newMeta.param
      // }

      //变量类型切换
      if (v.paramTypeId && newMeta.paramTypeId != v.paramTypeId) { //paramTypeId改变
        console.log("paramTypeId changed, v.id= " + v.paramTypeId)
        const paramType = getParamTypeById(ref.current.paramTypeList, v.paramTypeId, newMeta.paramType)
        newMeta.paramType = paramType
        newMeta.paramTypeId = v.paramTypeId
        newMeta.type = paramType?.code

        form?.setFieldValue("exprId", undefined)
        form?.setFieldValue("paramId", undefined)
        form?.setFieldValue("opId", undefined)
        
        newMeta.paramId = undefined
        newMeta.param = undefined
        
        newMeta.opId = undefined
        newMeta.op = undefined
        
        updateOpAndOperandsIfParamTypeChanged()

        newMeta.operandMetaObj = {}
        setNewExprId(undefined)
        setOpTooltip(undefined)
      }

      //操作符切换
      if (v.opId && newMeta.opId != v.opId) {
           // console.log("opId changed...")
           const op = getOpcodeById(ref.current.paramTypeList, v.opId, newMeta.param?.paramType.id || newMeta.paramType?.id, newMeta)
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
      
      if(!newMeta.paramType) newMeta.paramType = getParamTypeById(ref.current.paramTypeList, newMeta.paramTypeId)

      if (!newMeta.opId) {
        console.log("newMeta=", newMeta)
        message.warning("没有选择操作符")
        return false
      }
   
      //变量本身是否必须
      // if (!paramCfg || (paramCfg && paramCfg.required)) {
      //   if (!newMeta.paramId && (!newMeta.mapKey || newMeta.paramTypeId === undefined)) {
      //     console.log("newMeta=", newMeta)
      //     message.warning("没有配置变量")
      //     return false
      //   }
      // }
      if (!oprandConfigList) {
        console.log("newMeta=", newMeta)
        message.warning("没有操作数配置")
        return false
      }
      if (oprandConfigList.length > 0) {
        for (let i = 0; i < oprandConfigList.length; i++) {
          const e = oprandConfigList[i]
          const operandMeta = newMeta.operandMetaObj[e.name]
          if (e.required && (!operandMeta || (operandMeta.jsonValue?.v === undefined && !operandMeta.paramId))) {
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
      key="exprId"
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


    {EnableParamCategory ?
      <ProFormCascader
        name="paramId" //单选：[1, 5] 以及 [4]；
        key="paramId"
        label="已有变量"
        tooltip="已创建过的变量、变量二选一"
        initialValue={newMeta?.paramId}
        request={() => asyncSelectProps2Request<ParamCategory, ParamCategoryQueryParams>({
          key: ParamCategoryKeyPrefix + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
          url: `${Host}/api/rule/composer/list/paramCategory`,
          query: { domainId: domainId, setupChildren: true, pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
          convertFunc: (item) => {
            return { label: item.label, value: item.id, children: item.children?.map((e) => ({ label: e.label, value: e.id })) }
          }
        }, (list) => {
          console.log("load param list done, set param in meta...")
            ref.current.paramList = list
            newMeta.param = getParamById(list, newMeta?.paramId, domainId) //meta中删除，重建param
            newMeta.paramType = newMeta.param?.paramType
            newMeta.type = newMeta.paramType?.code
        })} /> :
      <ProFormSelect
        name="paramId"
        key="paramId"
        label="已有变量"
        tooltip="已创建过的变量、变量二选一"
        initialValue={newMeta?.paramId}
        request={() => asyncSelectProps2Request<Param, ParamQueryParams>({
          key: ParamKeyPrefix + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
          url: `${Host}/api/rule/composer/list/param`,
          query: { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
          convertFunc: (item) => {
            return { label: item.label, value: item.id }
          }
        }, (list) => {
          console.log("load param list done, set param in meta...")
          ref.current.paramList = list
          newMeta.param = getParamById(list, newMeta?.paramId, domainId) //meta中删除，重建param
          newMeta.paramType = newMeta.param?.paramType
          newMeta.type = newMeta.paramType?.code
      })}
      />
    }
   

    <Space.Compact style={{ width: '100%' }}>
      <ProFormSelect
        label="或变量"
        tooltip="变量三要素：类型、索引键、附属信息"
        width="sm"
        key= "paramTypeId"
        name="paramTypeId"
        //disabled={!!exprId || !!paramId}
        initialValue={newMeta?.paramTypeId}
        request={() => asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
          key: AllParamTypeKey,//不提供key，则不缓存
          url: `${Host}/api/rule/composer/list/paramType`,
          query: { pagination: { pageSize: -1, sKey: "id", sort: -1 } },//pageSize: -1为全部加载
          convertFunc: (item) => { 
            return { label: item.label, value: item.id } 
          }
        }, (list) => {
          console.log("load all paramType done, set opcode options and operands...")
          ref.current.paramTypeList = list
          updateOpAndOperandsIfParamTypeChanged()
        })}
      />
      <ProFormText
        width="sm"
        name="mapKey"
        key= "1mapKey"
        fieldProps={{ placeholder: "索引键" }}
        initialValue={newMeta?.mapKey}
      />
      <ProFormText
        width="sm"
        name="extra"
        key="extra"
        fieldProps={{ placeholder: "附属信息" }}
        initialValue={newMeta.param?.extra || newMeta.extra}
      />
    </Space.Compact>

    <ProFormSelect
      label="操作符"
      name="opId"
      initialValue={newMeta?.opId}
      tooltip={opTooltip}
      options={opcodeOptions}
    />

  
    {
      (!oprandConfigList || !paramType) ?  <div>请选择操作符</div> : <>
      {
        oprandConfigList.filter(e => e.enable).map((e) => 
          <OperandValueMetaEditor key={`${exprId}-${newMeta.paramId}-${newMeta.paramTypeId}-${newMeta.opId}-` + e.name}
            paramType={paramType}
            operandConfig={e}
            constantQueryParams={getConstantQueryParams(e, newMeta.param, newMeta.paramType, domainId)}
            domainId={domainId}
            //disabled={!!exprId}
            value={newMeta.operandMetaObj[e.name]}
            onChange={(v) => {
              newMeta.operandMetaObj[e.name] = v
              setNewMeta({ ...newMeta })
            }} />
        )
      }
      </> 
      

    }

  </ModalForm>
}

/**
 * 根据operandConfig生成缺省的OperandValueMeta
 * @param operandConfig 
 */
const defaultOperandValueMeta = (operandConfig: OperandConfig) => {
  const operandMeta: OperandMeta = {}
  if (operandConfig.defaultType) {
    operandMeta.t = operandConfig.defaultType
    return operandMeta
  }
  if (operandConfig.selectOptions && operandConfig.selectOptions.length > 0 && operandConfig.defaultSelect) {
    operandMeta.t = 'C'
    operandMeta.constIds = operandConfig.defaultSelect
    operandMeta.jsonValue = { _class: "String", v: operandConfig.defaultSelect }
    return operandMeta
  }
  if (operandConfig.contantIds && operandConfig.typeCode) {
    operandMeta.t = 'C'
    return operandMeta
  }
  return undefined
}





/**
 * 根据id从缓存中获取ParamType
 * @param paramTypeId 
 * @param defaultValue 
 * @returns 
 */
const getOpcodeById = (list?: ParamType[], opId?: number, paramTypeId?: number, meta?: BasicExpressionMeta) => {
  let opcode: Opcode | undefined = Cache.findOne(OpKeyPrefix + paramTypeId, opId, "id")
  if(!opcode) opcode = ArrayUtil.findOne(getParamTypeById(list, paramTypeId, meta?.paramType)?.supportOps || [], opId, "id")
  if (!opcode) opcode = meta?.op
  return opcode
}
/**
 * 根据id从缓存中获取ParamType
 * @param paramTypeId 
 * @param defaultValue 
 * @returns 
 */
const getParamTypeById = (list?: ParamType[], paramTypeId?: number, defaultValue?: ParamType) => {
  let paramType: ParamType | undefined =  ArrayUtil.findOne(list, paramTypeId, "id")
  if (!paramType) Cache.findOne(AllParamTypeKey, paramTypeId, "id")
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
const getParamById = (list? : Param[], paramId?: number | number[], domainId?: number, defaultValue?: Param) => {
  if (!paramId) return undefined

  let param: Param | undefined
  if (EnableParamCategory) {
    if (Array.isArray(paramId) && paramId.length === 2) {

      let elems: Param[] | undefined = TreeCache.getElementsByPathIdsInTree(list, paramId,  "id")
      if(!elems) elems = TreeCache.getElementsByPathIdsInTreeFromCache(ParamCategoryKeyPrefix + domainId, paramId, "id")
      if (elems) {
        param = elems[1]
      } else {
        console.warn("not found elems by path")
      }
    } else {
      console.warn("invalid paramId, it's not array with length==2, paramId=", paramId)
    }
  } else {
    param = ArrayUtil.findOne(list, paramId as number, "id")
    if(!param) param = Cache.findOne(ParamKeyPrefix + domainId, paramId as number, "id")//Cache.findOne("param/domain/" + domainId, paramId, "id")
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

