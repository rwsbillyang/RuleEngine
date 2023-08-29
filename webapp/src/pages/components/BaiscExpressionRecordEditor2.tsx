// import React, { useEffect, useState } from "react";
// import { ModalForm } from "@ant-design/pro-form";
// import { AllDomainKey, AllParamTypeKey,  BasicExpressionMeta, Domain, DomainQueryParams, Operator, OperatorQueryParams, Param, ParamType, ParamTypeQueryParams } from "../DataType";

// import { Cache, cachedGet } from "@rwsbillyang/usecache"
// import { asyncSelectProps2Request } from "@/myPro/MyProTableProps";
// import { Host } from "@/Config";
// import { ValueMetaEditor } from "./ValueMetaEditor";
// import { Button, Form, Select } from "antd";

// import { DefaultOptionType } from "rc-select/lib/Select";
// import { checkAvailable, getConstantQueryParams } from "./BaiscExpressionRecordEditor";



// /***
//  * for debug
//  * 选中domainId后，会决定有哪些 param 可供选择，选中paramId后决定支持哪些 operator, 选中opId后决定需要哪些填写哪些值
//  */
// export const BaiscExpressionRecordEditor2: React.FC<{  record?: Partial<BasicExpressionMeta> , domainId?: number }> = ({ record, domainId }) => {
//   const [data, setData] = useState(record)
//   const [domainOptions, setDomainOptions] = useState<DefaultOptionType[]>()
//   const [params, setParams] = useState<Param[]>([])
//   const [ops, setOps] = useState<Operator[]>([])
//   const [valueMapParam, setValueMapParam] = useState< { err?: string, multiple?: boolean,  other?: boolean, start?: boolean, end?: boolean, set?: boolean, e?: boolean, num?: boolean } >({})

//   //加载 all paramType 后面需要
//   useEffect(() => {
//     asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
//       key: AllParamTypeKey,//不提供key，则不缓存
//       url: `${Host}/api/rule/composer/list/paramType`,
//       query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
//       //convertFunc: (item) => { return { label: item.code, value: item.id } }
//     }).then(() => console.log("get AllParamType done"))

//     asyncSelectProps2Request<Domain, DomainQueryParams>({
//       key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
//       url: `${Host}/api/rule/composer/list/domain`,
//       query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
//       convertFunc: (item) => {
//         return { label: item.label, value: item.id }
//       }
//     }).then(list => setDomainOptions(list))
//   }, [])

//   //domainId, paramId, opId变化导致重新渲染 底部的各ValueMetaEditor，需等上面的加载完毕后再执行
//   const updateValueMapParam = (param?: Param, op?: Operator) => {
//     if (!op || !param){
//        setValueMapParam({ err: "请选择变量和比较符" })
//     }else{
//       const code = param.paramType.code
//       const multiple = code.indexOf("Set") > 0
  
//       const p = checkAvailable(param, op)
//       const ret = {...p, multiple}

//       console.log("updateValueMapParam: =")
//       console.log(ret)

//       setValueMapParam(ret) 
//     }   
//   }

//   useEffect(() => {
//     cachedGet<Param[]>(`${Host}/api/rule/composer/list/param`, (list) => {
//       setParams(list)

//       //current.params = list
//       console.log("load Param done after domainId updated, param.length=" + list.length)
//     }, { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
//       "param/domain/" + domainId,//不提供key，则不缓存，每次均从远程请求
//     )
//   }, [])


//   //加载操作符，必须等上面的param加载完毕后再加载，因为需要利用其缓存
//   useEffect(() => {
//     const asyncGetOpOptions = (paramId?: number) => {
//       if (!paramId || !params) return new Promise(resolve => resolve([]))

//       const param: Param | undefined = Cache.findOneInArray(params, paramId, "id")//Cache.findOne("param/domain/" + domainId, paramId, "id")
//       if (!param) {
//         console.log("Not found param for paramId=" + paramId)
//         return new Promise(resolve => resolve([]))
//       }
//       const supportOps = param.paramType.supportOps
//       if (supportOps && supportOps.length > 0) {
//         return new Promise(resolve => resolve(supportOps))
//       } else {
//         // cachedGet<Operator[]>(`${Host}/api/rule/composer/list/operator`, (data)=>{
//         //   const options = data.map((item)=>{ return { label: item.label + "(" + item.code + ")", value: item.id }})
//         // setOpOptions(options)
//         // },
//         // { ids: param.paramType.supportOpIds, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
//         // "ops/type/" + param.paramType.id
//         // )
//         console.log("Load ops from remote, paramId=" + paramId)
//         return asyncSelectProps2Request<Operator, OperatorQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
//           key: "ops/type/" + param.paramType.id,//不提供key，则不缓存，每次均从远程请求
//           url: `${Host}/api/rule/composer/list/operator`,
//           query: { ids: param.paramType.supportOpIds, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
//           // convertFunc: (item) => {
//           //   return { label: item.label + "(" + item.code + ")", value: item.id }
//           // }
//         })
//       }
//     }
//     asyncGetOpOptions(data?.paramId).then(list => {
//       setOps(list)
//      // current.ops = list
//       console.log("load ops done, deps=[data?.paramId]: data=")
//       console.log(data)
//     })
//   }, [data?.paramId])//domainId变化后 加载op列表，但最好需等到上面的params加载完毕后触发，一般认为在选择param时param列表已加载完毕



 
//   return <ModalForm initialValues={data} layout="horizontal"
//     title="基本表达式"
//     trigger={
//       <Button type="primary">
//         新建基本表达式
//       </Button>
//     }
//     autoFocusFirstInput
//     modalProps={{
//       destroyOnClose: true,
//       onCancel: () => console.log('run'),
//     }}
//     submitTimeout={2000}
//     onFinish={async (values) => {
//       console.log("ModalForm.onFinish: values=");
//       console.log(values);
//       //message.success('提交成功');
//       return true;
//     }}>



//     <Form.Item name="paramId" label="变量">
//       <Select value={data?.paramId || null} options={params.map((item) => { return { label: "(" + item.paramType.label + ")" + item.label + "(id:" + item.id + ")", value: item.id } })}
//         onChange={(v: number) => {
//           const param = Cache.findOneInArray(params, v, "id")
//           setData({  paramId: v, param })
//           updateValueMapParam(param)
//         }} />
//     </Form.Item>

//     <Form.Item name="opId" label="比较符">
//       <Select value={data?.opId || null} options={ops?.map((item) => { return { label: item.label + "(" + item.code + ")", value: item.id } })}
//         onChange={(v: number) => {
//           const op = Cache.findOneInArray(ops, v, "id")
//           setData({  paramId: data?.paramId, opId: v, op })
//           updateValueMapParam(data?.param, op)
//         }}
//       />
//     </Form.Item>


//     {(valueMapParam.err) ? <div>Err: {valueMapParam.err} </div> : <div>
//      <div>操作数：</div>
//       {valueMapParam.other && <ValueMetaEditor name="other" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, data?.param)} label="值" param={data?.param} domainId={domainId} multiple={valueMapParam.multiple || false} value={data?.other} />}
//       {valueMapParam.start && <ValueMetaEditor name="start" constantQueryParams={getConstantQueryParams( { useSelf: true }, domainId, data?.param)} label="起始" param={data?.param} domainId={domainId} multiple={false} value={data?.start} />}
//       {valueMapParam.end && <ValueMetaEditor name="end" constantQueryParams={getConstantQueryParams( { useSelf: true }, domainId, data?.param)} label="终止" param={data?.param} domainId={domainId} multiple={false} oldValue={data?.end} />}
//       {valueMapParam.set && <ValueMetaEditor name="set" constantQueryParams={getConstantQueryParams({ toSetType: true }, domainId, data?.param)} label="集合" param={data?.param} domainId={domainId} multiple={true} oldValue={data?.set} />}
//       {valueMapParam.e && <ValueMetaEditor name="e" constantQueryParams={getConstantQueryParams({ toBasicType: true }, domainId, data?.param)} label="某项" param={data?.param} domainId={domainId} multiple={false} oldValue={data?.e} />}
//       {valueMapParam.num && <ValueMetaEditor name="num" constantQueryParams={getConstantQueryParams( { paramType: ["Int", "Long"] }, domainId, data?.param)} label="数量" param={data?.param} domainId={domainId} multiple={false} oldValue={data?.num} />}
//     </div>

//     }

//   </ModalForm>
// }

