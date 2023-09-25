import React, { useState } from 'react';
import { Button, Form, message } from 'antd';

import { AllDomainKey, ComplexExpressionRecord, Domain, DomainQueryParams, ExpressionQueryParams } from '../DataType';

import { Host } from '@/Config';
import { ModalForm, ProFormDependency, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-form';
import { MyProTableProps, asyncSelectProps2Request } from '@/myPro/MyProTableProps';
import { saveOne } from '@/myPro/MyProTable';
import { complexExpressionMeta2String } from '../utils';

import { ComplexExprMetaEditModal } from './ComplexExprMetaEditModal';

/**
 * ComplexExpressionRecord 复合表达式数据库记录 对话框编辑器
 * @param isAdd 
 * @param record 
 * @param tableProps 
 * @returns 
 */
export const ComplexExpressionRecordEditor: React.FC<{
  isAdd: boolean,
  record?: Partial<ComplexExpressionRecord>,
  tableProps: MyProTableProps<ComplexExpressionRecord, ExpressionQueryParams>
}> = ({ isAdd, record, tableProps }) => {
  // let { state } = useLocation();

  const [meta, setMeta] = useState(record?.meta)

  //console.log("ComplexExpressionRecordEditor, record=", record)


  return <ModalForm<ComplexExpressionRecord> initialValues={record} layout="horizontal"
    title="复合逻辑表达式"
    trigger={isAdd ? <Button type="primary">新建</Button> : <a key="editLink">编辑</a>}
    autoFocusFirstInput
    omitNil={false} //去掉将不能清除数据，因为需要undfined来清除掉旧数据
    modalProps={{
      destroyOnClose: false,
      //onCancel: () => console.log('run'),
    }}
    submitTimeout={2000}
    onFinish={async (values) => {
      values.meta = meta
      console.log("ComplexExpressionRecordEditor: ModalForm.onFinish: values=", values);
      if (!meta) {
        message.warning("请编辑表达式")
        return false
      }

      return saveOne(values, record, tableProps.saveApi, tableProps.transformBeforeSave, undefined,
        isAdd, tableProps.listApi, tableProps.cacheKey, tableProps.idKey)
      // return true
    }}>

    <ProFormText
      hidden
      initialValue='Complex'
      name="type"
      label="类型" />

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
      rules={[{ required: true, message: '必填' }]}
    />

    <ProFormDependency name={["domainId"]}>
      {({ domainId }) => {
        return <Form.Item label="表达式" required>
          {complexExpressionMeta2String(meta)} <ComplexExprMetaEditModal onDone={setMeta}
            domainId={domainId} meta={meta} cannotChooseOne/>
        </Form.Item>
      }}
    </ProFormDependency>

    <ProFormTextArea
      name="remark"
      label="备注" />
  </ModalForm>
}