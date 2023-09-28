import React, { useEffect, useState } from "react";
import { ModalForm, ProFormDependency, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-form";
import { AllDomainKey, AllParamTypeKey, BasicExpressionRecord, Domain, DomainQueryParams, ExpressionQueryParams, ParamType, ParamTypeQueryParams } from "../DataType";

import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps";
import { Host } from "@/Config";
import { Button, Form, message } from "antd";

import { saveOne } from "@/myPro/MyProTable";
import { basicExpressionMeta2String} from "../utils";
import { BasicExprMetaEditModal } from "./BasicExprMetaEditModal";


/***
 * 选中domainId后，会决定有哪些 param 可供选择，选中paramId后决定支持哪些 Opcode, 选中opId后决定需要哪些填写哪些值
 * @param isAdd
 * @param record 经transformBeforeEdit转换的值
 * @param tableProps 表格属性，其中配置用于缓存键、saveApi，提交保存时需用到，保存后更新缓存
 */
export const BaiscExpressionRecordEditor: React.FC<{
  isAdd: boolean,
  record?: Partial<BasicExpressionRecord>,
  tableProps: MyProTableProps<BasicExpressionRecord, ExpressionQueryParams>
}> = ({ isAdd, record, tableProps }) => {

  //const initialMeta: BasicExpressionMeta = { _class: "Basic" }
  const [meta, setMeta] = useState(record?.meta)

  //console.log("BaiscExpressionRecordEditor, record=", record)

  //加载 all paramType 后面需要
  useEffect(() => {
    asyncSelectProps2Request<ParamType, ParamTypeQueryParams>({
      key: AllParamTypeKey,//不提供key，则不缓存
      url: `${Host}/api/rule/composer/list/paramType`,
      query: { pagination: { pageSize: -1, sKey: "id", sort: -1 } },//pageSize: -1为全部加载
      //convertFunc: (item) => { return { label: item.code, value: item.id } }
    }).then(() => console.log("get AllParamType done"))
  }, [])



  return <ModalForm<BasicExpressionRecord> initialValues={record} layout="horizontal"
    title="基本表达式"
    trigger={isAdd ? <Button type="primary">新建</Button> : <a key="editLink">编辑</a>}
    autoFocusFirstInput
    omitNil={false} //去掉将不能清除数据，因为需要undfined来清除掉旧数据
    modalProps={{
      destroyOnClose: false,
      //onCancel: () => console.log('run'),
    }}
    submitTimeout={2000}
    onFinish={async (values) => {
      console.log("BaiscExpressionRecordEditor: ModalForm.onFinish: values=", values);
      if(!meta){
        message.warning("请编辑表达式")
        return false
      }else{
        values.meta = meta

        return saveOne(values, record, tableProps.saveApi, tableProps.transformBeforeSave, undefined,
          isAdd, tableProps.listApi, tableProps.cacheKey, tableProps.idKey)
        // return true
      }
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


    <ProFormDependency name={["domainId"]}>
      {({ domainId }) => {
        return <Form.Item label="表达式" required>
          {basicExpressionMeta2String(meta)} <BasicExprMetaEditModal onDone={setMeta}
            domainId={domainId} meta={meta} cannotChooseOne={true} />
        </Form.Item>
      }}
    </ProFormDependency>

    {/* <ProFormSelect
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
            {other && <OperandMetaEditor name="other" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, param)} label="值" param={param} domainId={domainId} multiple={multiple === true} value={meta.other} onChange={(v) => { setMeta({ ...meta, other: v }) }} />}
            {start && <OperandMetaEditor name="start" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, param)} label="起始" param={param} domainId={domainId} multiple={false} value={meta.start} onChange={(v) => { setMeta({ ...meta, start: v }) }} />}
            {end && <OperandMetaEditor name="end" constantQueryParams={getConstantQueryParams({ useSelf: true }, domainId, param)} label="终止" param={param} domainId={domainId} multiple={false} value={meta.end} onChange={(v) => { setMeta({ ...meta, end: v }) }} />}
            {set && <OperandMetaEditor name="set" constantQueryParams={getConstantQueryParams({ toSetType: true }, domainId, param)} label="集合" param={param} domainId={domainId} multiple={true} value={meta.set} onChange={(v) => { setMeta({ ...meta, set: v }) }} />}
            {e && <OperandMetaEditor name="e" constantQueryParams={getConstantQueryParams({ toBasicType: true }, domainId, param)} label="某项" param={param} domainId={domainId} multiple={false} value={meta.e} onChange={(v) => { setMeta({ ...meta, e: v }) }} />}
            {num && <OperandMetaEditor name="num" constantQueryParams={getConstantQueryParams({ paramType: ["Int", "Long"] }, domainId, param)} label="数量" param={param} domainId={domainId} multiple={false} value={meta.num} onChange={(v) => { setMeta({ ...meta, num: v }) }} />}
          </>

        }}
      </ProFormDependency> */}

    <ProFormTextArea
      name="remark"
      label="备注" />
  </ModalForm>
}


