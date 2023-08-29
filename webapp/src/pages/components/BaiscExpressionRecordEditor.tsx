import React, { useEffect, useState } from "react";
import { ModalForm, ProFormDependency, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-form";
import { AllDomainKey, AllParamTypeKey, BasicExpressionMeta, BasicExpressionRecord, ConstantQueryParams, Domain, DomainQueryParams, ExpressionQueryParams, Operator, OperatorQueryParams, Param, ParamQueryParams, ParamType, ParamTypeQueryParams } from "../DataType";
import { Cache, contains } from "@rwsbillyang/usecache"
import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps";
import { Host } from "@/Config";
import { ValueMetaEditor } from "./ValueMetaEditor";
import { Button } from "antd";

import { saveOne } from "@/myPro/MyProTable";
import { getBasicTypeId, typeCode2Id } from "../basic/utils";


/***
 * 选中domainId后，会决定有哪些 param 可供选择，选中paramId后决定支持哪些 operator, 选中opId后决定需要哪些填写哪些值
 * @param isAdd
 * @param record 原数据，编辑字段将与其合并和提交
 * @param tableProps 表格属性，其中配置用于缓存键、saveApi，提交保存时需用到，保存后更新缓存
 */
export const BaiscExpressionRecordEditor: React.FC<{ isAdd: boolean, record?: Partial<BasicExpressionRecord>, tableProps: MyProTableProps<BasicExpressionRecord, ExpressionQueryParams> }> = ({ isAdd, record, tableProps }) => {
  const initialMeta: BasicExpressionMeta = { _class: "Basic" }
  const [meta, setMeta] = useState(record?.meta || initialMeta)

  //console.log("BaiscExpressionRecordEditor, record=", record)

  //加载 all paramType 后面需要
  useEffect(() => {
    asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
      key: AllParamTypeKey,//不提供key，则不缓存
      url: `${Host}/api/rule/composer/list/paramType`,
      query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
      //convertFunc: (item) => { return { label: item.code, value: item.id } }
    }).then(() => console.log("get AllParamType done"))
  }, [])



  return <ModalForm<BasicExpressionRecord> initialValues={record} layout="horizontal"
    title="基本逻辑表达式"
    trigger={isAdd ? <Button type="primary">新建</Button> : <a key="editLink">编辑</a>}
    autoFocusFirstInput
    modalProps={{
      destroyOnClose: false,
      //onCancel: () => console.log('run'),
    }}
    submitTimeout={2000}
    onFinish={async (values) => {
      console.log("BaiscExpressionRecordEditor: ModalForm.onFinish: values=", values);
      values.meta = meta
      return saveOne<BasicExpressionRecord, ExpressionQueryParams>(values, tableProps, isAdd, record)
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
      required
    />


    <ProFormText
      hidden
      initialValue={record?.type || 'Basic'}
      name="type"
      label="类型" />


    <ProFormSelect
      name="paramId"
      dependencies={['domainId']}
      label="变量"
      required
      request={(params) => asyncSelectProps2Request<Param, ParamQueryParams>({
        key: "param/domain/" + params.domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
        url: `${Host}/api/rule/composer/list/param`,
        query: { domainId: params.domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
        convertFunc: (item) => {
          return { label: "(" + item.paramType.label + ")" + item.label, value: item.id }
        }
      })}
    />


    <ProFormSelect
      name="opId"
      label="比较符"
      required
      dependencies={['paramId', 'domainId']}
      request={(params) => asyncGetOpOptions(params.paramId, params.domainId)}
    />

    <ProFormDependency name={['domainId', "paramId", "opId"]}>
      {({ domainId, paramId, opId }) => {
        // console.log("domainId=" + domainId + ", paramId=" + paramId + ", opId=" + opId)
        const c = getValueMapParam(domainId, paramId, opId)

        const { err, other, start, end, set, e, num, multiple, param, op } = c

        meta.paramId = paramId
        meta.opId = opId
        meta.param = param
        meta.op = op
        if (param) meta._class = param.paramType.code

        //去掉不需要的，上次修改时保留的值
        if (!other) delete meta.other
        if (!start) delete meta.start
        if (!end) delete meta.end
        if (!set) delete meta.set
        if (!e) delete meta.e
        if (!num) delete meta.num

        return err ? <div> {err} </div> : <>
          {other && <ValueMetaEditor name="other" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, param)} label="值" param={param} domainId={domainId} multiple={multiple === true} value={meta.other} onChange={(v) => { setMeta({ ...meta, other: v }) }} />}
          {start && <ValueMetaEditor name="start" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, param)} label="起始" param={param} domainId={domainId} multiple={false} value={meta.start} onChange={(v) => { setMeta({ ...meta, start: v }) }} />}
          {end && <ValueMetaEditor name="end" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, param)} label="终止" param={param} domainId={domainId} multiple={false} value={meta.end} onChange={(v) => { setMeta({ ...meta, end: v }) }} />}
          {set && <ValueMetaEditor name="set" constantQueryParams={getConstantQueryParams({ toSetType: true }, domainId, param)} label="集合" param={param} domainId={domainId} multiple={true} value={meta.set} onChange={(v) => { setMeta({ ...meta, set: v }) }} />}
          {e && <ValueMetaEditor name="e" constantQueryParams={getConstantQueryParams({ toBasicType: true }, domainId, param)} label="某项" param={param} domainId={domainId} multiple={false} value={meta.e} onChange={(v) => { setMeta({ ...meta, e: v }) }} />}
          {num && <ValueMetaEditor name="num" constantQueryParams={getConstantQueryParams({ paramType: ["Int", "Long"] }, domainId, param)} label="数量" param={param} domainId={domainId} multiple={false} value={meta.num} onChange={(v) => { setMeta({ ...meta, num: v }) }} />}
        </>

      }}
    </ProFormDependency>

    <ProFormTextArea
      name="remark"
      label="备注" />
  </ModalForm>
}




//加载操作符list，必须等上面的param加载完毕后再加载，因为需要利用其缓存
export const asyncGetOpOptions = (paramId?: number, domainId?: number) => {
  if (!paramId) return new Promise(resolve => resolve([]))

  const param: Param | undefined = Cache.findOne("param/domain/" + domainId, paramId, "id")//Cache.findOne("param/domain/" + domainId, paramId, "id")
  if (!param) {
    console.log("Not found param for paramId=" + paramId)
    return new Promise(resolve => resolve([]))
  }
  const supportOps = param.paramType.supportOps
  if (supportOps && supportOps.length > 0) {
    return new Promise(resolve => resolve(supportOps.map((item) => { return { label: item.label + "(" + item.code + ")", value: item.id } })))
  } else {
    return asyncSelectProps2Request<Operator, OperatorQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
      key: "ops/type/" + param.paramType.id,//不提供key，则不缓存，每次均从远程请求
      url: `${Host}/api/rule/composer/list/operator`,
      query: { ids: param.paramType.supportOpIds, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
      convertFunc: (item) => {
        return { label: item.label + "(" + item.code + ")", value: item.id }
      }
    })
  }
}


export interface OperandConfig {
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

export const getValueMapParam = (domainId?: number, paramId?: number, opId?: number) => {
  const param: Param | undefined = Cache.findOne("param/domain/" + domainId, paramId, "id")
  let config: OperandConfig = {}
  if (!param) {
    config.err = "请选择变量和比较符"
  } else {
    const code = param.paramType.code
    const multiple = code.indexOf("Set") > 0

    let op: Operator | undefined = param.paramType.supportOps ? Cache.findOneInArray(param.paramType.supportOps, opId, "id") : undefined
    if (!op) op = Cache.findOne("ops/type/" + param.paramType.id, opId, "id")

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
export const getConstantQueryParams = (config: ParamTypeConfig, domainId?: number, param?: Param) => {

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


