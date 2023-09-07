// import React, { useEffect, useRef, useState } from "react";
// import { ModalForm, ProFormDependency, ProFormInstance, ProFormSelect } from "@ant-design/pro-form";
// import { BasicExpressionMeta, Expression, Param, ParamQueryParams } from "../DataType";

// import { Cache } from "@rwsbillyang/usecache"
// import { asyncSelectProps2Request } from "@/myPro/MyProTableProps";
// import { Host } from "@/Config";
// import { ValueMetaEditor } from "./ValueMetaEditor";
// import { OperandConfig, asyncGetOpOptions, checkAvailable, getConstantQueryParams, getValueMapParam } from "./BaiscExpressionRecordEditor";


// export interface Condition {
//   exprId?: number,
//   meta: BasicExpressionMeta
// }


// /***
//  * 编辑基本表达式BasicExpressionMeta，确定键值、比较符和操作数
//  * @param title 展示的名称，ComplexExpressionEditor中需自定义
//  * @param triggerName trigger中名称，一般默认，ComplexExpressionEditor中需自定义
//  * @param domainId
//  * @param onDone 完成后执行的回调
//  * @param exprId 初始值，来自于哪个expression id
//  * @param meta 初始值
//  * @param onlyCreatNew 若为true则不能选择现有的表达式，只能新建一个BasicExpressionMeta，适用于ComplexExpressionEditor新增一个基本表达式
//  */
// export const ConditionEditor: React.FC<{
//   title?: string,
//   triggerName?: string,
//   domainId?: number,
//   onDone: (Condition) => void,
//   exprId?: number,
//   meta?: BasicExpressionMeta
//   onlyCreatNew?: boolean
// }> = ({ title, triggerName, domainId, onDone, exprId, meta, onlyCreatNew }) => {
//   const initialMeta: BasicExpressionMeta = { _class: "basic" }
//   const [newExprId, setNewExprId] = useState(exprId)
//   const [newMeta, setNewMeta] = useState(meta || initialMeta)

//   const formRef = useRef<ProFormInstance>()
//   useEffect(() => {
//     if (newExprId) {
//       const expression: Expression | undefined = Cache.findOne("expression/domain/" + domainId, newExprId, "id")
//       const meta = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined
//       //console.log("=====update newMeta by newExprId=" + newExprId)
//       //console.log(meta)
//       if(meta) setNewMeta(meta)

//       //子组件因为使用了useState，传入的meta不能生效，故采用发送事件方式更新
//       //dispatch({ type: "updateMetaValue", payload: meta })

//       formRef?.current?.setFieldValue("paramId", meta?.paramId)
//       formRef?.current?.setFieldValue("opId", meta?.opId)
//     } else {//清空了exprId
//       setNewMeta({ _class: "basic" })
//     }

//   }, [newExprId])



//   return <ModalForm
//     formRef={formRef}
//     layout="horizontal"
//     title={title || "编辑规则条件"}
//     trigger={<a >{triggerName || "编辑"}</a>}
//     autoFocusFirstInput
//     modalProps={{
//       destroyOnClose: false,
//     }}
//     onValuesChange={(v) => {
//      // console.log("onValuesChange:" + JSON.stringify(v))
//       setNewExprId(v?.exprId)
//       //setNewMeta({ ...newMeta, paramId: v?.paramId, opId: v?.opId })
//     }}
//     submitTimeout={2000}
//     onFinish={async (values) => {
//       //console.log("ConditionEditor: ModalForm.onFinish: values=");
//       //console.log(values); //{paramId: 2, opId: 1}
//       const c = { exprId: newExprId, meta: newMeta }
//       //console.log(c);
//       onDone(c)
//       return true
//     }}>


//     <ProFormSelect
//       name="exprId"
//       label="逻辑表达式"
//       disabled={onlyCreatNew}
//       tooltip="使用现有表达式或使用下面的创建一个条件"
//       request={onlyCreatNew? undefined : () => asyncSelectProps2Request<Param, ParamQueryParams>({
//         key: "expression/domain/" + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
//         url: `${Host}/api/rule/composer/list/expression`,
//         query: { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
//         convertFunc: (item) => {
//           return { label: item.label, value: item.id }
//         }
//       })}
//     />


//     <ProFormDependency name={["exprId"]}>
//       {({ exprId }) => {
//         return <>
//           <ProFormSelect
//             name="paramId"
//             label="变量"
//             initialValue={newMeta?.paramId}
//             disabled={!!exprId}
//             request={() => asyncSelectProps2Request<Param, ParamQueryParams>({
//               key: "param/domain/" + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
//               url: `${Host}/api/rule/composer/list/param`,
//               query: { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
//               convertFunc: (item) => {
//                 return { label: "(" + item.paramType.label + ")" + item.label, value: item.id }
//               }
//             })}
//           />

//           <ProFormSelect
//             name="opId"
//             initialValue={newMeta?.opId}
//             label="比较符"
//             disabled={!!exprId}
//             dependencies={['paramId']}
//             request={(params) => asyncGetOpOptions(params.paramId, domainId)}
//           />
//         </>
//       }}
//     </ProFormDependency>

//     <ProFormDependency name={["exprId", "paramId", "opId"]}>
//       {({ exprId, paramId, opId }) => {
//         let operandConfig: OperandConfig //= calulateConfig(exprId, paramId, opId)

//         if (exprId) {
//           // const expression: Expression | undefined = Cache.findOne("expression/domain/" + domainId, newExprId, "id")
//           // const meta = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined

//           // console.log("update newMeta")

//           //未在useEffect中赋值，改由此处更新newMeta信息
//           //newMeta.param = meta.param
//           //newMeta.op = meta.op
//           // newMeta.opId = meta.opId
//           // newMeta.paramId = meta.paramId
//           // newMeta.other = meta.other
//           // newMeta.start = meta.start
//           // newMeta.end = meta.end
//           // newMeta.set = meta.set
//           // newMeta.e = meta.e
//           // newMeta.num = meta.num

//           operandConfig = checkAvailable(newMeta?.param, newMeta?.op)
//           operandConfig.param = newMeta?.param
//           operandConfig.op = newMeta?.op
//           operandConfig.err = !newMeta?.param ? "no param in meta" : undefined
//           operandConfig.multiple = newMeta?.param ? newMeta.param.paramType.code.indexOf("Set") > 0 : false
//         } else {
//           operandConfig = getValueMapParam(domainId, paramId, opId)
//         }
//         //将param和op元数据保留下来
//         newMeta.param = operandConfig.param  //newMeta.paramId更新后也需要更新对应的param
//         newMeta.op = operandConfig.op //同上
//         //console.log(newMeta)

//         //去掉不需要的，上次修改时保留的值
//         if (!operandConfig.other) delete newMeta.other
//         if (!operandConfig.start) delete newMeta.start
//         if (!operandConfig.end) delete newMeta.end
//         if (!operandConfig.set) delete newMeta.set
//         if (!operandConfig.e) delete newMeta.e
//         if (!operandConfig.num) delete newMeta.num

//         return operandConfig.err ? <div> {operandConfig.err} </div> : <>
//           {operandConfig.other && <ValueMetaEditor name="other" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, operandConfig.param)} label="值" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={operandConfig.multiple === true} value={newMeta.other} onChange={(v) => { setNewMeta({ ...newMeta, other: v }) }} />}

//           {operandConfig.start && <ValueMetaEditor name="start" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, operandConfig.param)} label="起始" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={false} value={newMeta.start} onChange={(v) => { setNewMeta({ ...newMeta, start: v }) }} />}

//           {operandConfig.end && <ValueMetaEditor name="end" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, operandConfig.param)} label="终止" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={false} value={newMeta.end} onChange={(v) => { setNewMeta({ ...newMeta, end: v }) }} />}

//           {operandConfig.set && <ValueMetaEditor name="set" constantQueryParams={getConstantQueryParams({ toSetType: true }, domainId, operandConfig.param)} label="集合" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={true} value={newMeta.set} onChange={(v) => { setNewMeta({ ...newMeta, set: v }) }} />}

//           {operandConfig.e && <ValueMetaEditor name="e" constantQueryParams={getConstantQueryParams({ toBasicType: true }, domainId, operandConfig.param)} label="某项" disabled={!!exprId} param={operandConfig.param} domainId={domainId} multiple={false} value={newMeta.e} onChange={(v) => { setNewMeta({ ...newMeta, e: v }) }} />}

//           {operandConfig.num && <ValueMetaEditor name="num" constantQueryParams={getConstantQueryParams({ paramType: ["Int", "Long"] }, domainId, operandConfig.param)} disabled={!!exprId} label="数量" param={operandConfig.param} domainId={domainId} multiple={false} value={newMeta.num} onChange={(v) => { setNewMeta({ ...newMeta, num: v }) }} />}
//         </>
//       }}
//     </ProFormDependency>




//   </ModalForm>
// }


