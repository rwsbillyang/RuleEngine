import React, {  useState } from "react";
import { ModalForm, ProFormDependency, ProFormSelect, ProFormText, ProFormTextArea } from "@ant-design/pro-form";
import { AllDomainKey,  BasicExpressionRecord, Domain, DomainQueryParams, ExpressionQueryParams } from "../DataType";


import { Host } from "@/Config";
import { Button, Form, message } from "antd";

import { EasyProTableProps, asyncSelectProps2Request,saveOne } from "easy-antd-pro";

import { basicExpressionMeta2String} from "../utils";
import { BasicExprMetaEditModalV2 } from "./BasicExprMetaEditModalV2";


/***
 * 选中domainId后，会决定有哪些 param 可供选择，选中paramId后决定支持哪些 Opcode, 选中opId后决定需要哪些填写哪些值
 * @param isAdd
 * @param record 经transformBeforeEdit转换的值
 * @param tableProps 表格属性，其中配置用于缓存键、saveApi，提交保存时需用到，保存后更新缓存
 */
export const BaiscExpressionRecordEditor: React.FC<{
  isAdd: boolean,
  record?: Partial<BasicExpressionRecord>,
  tableProps: EasyProTableProps<BasicExpressionRecord, ExpressionQueryParams>
}> = ({ isAdd, record, tableProps }) => {

  //const initialMeta: BasicExpressionMeta = { _class: "Basic" }
  const [meta, setMeta] = useState(record?.meta)

  //console.log("BaiscExpressionRecordEditor, record=", record)

  return <ModalForm<BasicExpressionRecord> initialValues={record} layout="horizontal"
    title="基本表达式"
    trigger={isAdd ? <Button type="primary">新建</Button> : <a key="editLink">编辑</a>}
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
          {basicExpressionMeta2String(meta)} <BasicExprMetaEditModalV2 onDone={setMeta} //不使用cannotChooseOne表示可以在现有基础上修改 快速创建
            domainId={domainId} meta={meta} />
        </Form.Item>
      }}
    </ProFormDependency>

    <ProFormTextArea
      name="remark"
      label="备注" />
  </ModalForm>
}


