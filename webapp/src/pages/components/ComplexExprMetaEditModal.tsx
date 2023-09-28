import React, { useEffect, useRef, useState } from 'react';
import { Form,  message } from 'antd';

import { Cache } from "@rwsbillyang/usecache"
import { ComplexExpressionMeta,  BaseExpressionRecord, ExpressionMeta, ExpressionQueryParams, ExpressionRecord, Opcode, OpcodeQueryParams } from '../DataType';

import { Host } from '@/Config';
import { ModalForm, ProFormInstance, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { asyncSelectProps2Request } from '@/myPro/MyProTableProps';

import { ComplexExprTransfer } from './ComplexExprTransfer';


const ExpressionKeyPrefix = "complexExpression/domain/"
export const LogicalOpKey = "op/Logical"
/**
 *  编辑ComplexExpressionMeta的Modal对话框：用于选择metaList和opId
 * 在创建规则时，可从现有表达式中选择
 * 
 * 包含了隐藏的_class字段、逻辑运算符选择，
 * 以及一个 (BasicExpressionMeta | ComplexExpressionMeta) 列表编辑器Transfer
 *  Transfer左侧显示当前可供选择的表达式，可将左侧表达式添加到右侧
 * 左侧底部按钮用于创建一个新的基本表达式，作为源;
 * 右侧底部按钮用于当前列表中的表达式用逻辑操作符连接起来，并继续添加到左侧，构造一个复合表达式，作为源;
 * 
 * Modal底部OK按钮，用于将右侧列表中的表达式连接起来，构造一个复合表达式，作为结果在onFinish中返回
 * 
 * 共同构成一个对话框，点击对话框后，父组件通过提供的onDone获取到ComplexExpressionMeta的值
 * 
 * @param title 展示的名称，如需自定义可指定
 * @param triggerName trigger中名称，如需自定义可指定
 * @param domainId
 * @param onDone 完成后执行的回调
 * @param exprId 选择一个现有的表达式记录，来自于哪个expression id
 * @param meta 初始值ComplexExpressionMeta
 * @param cannotChooseOne 若为true则不能选择现有的表达式，只能新建或编辑一个BasicExpressionMeta，适用于Record的新增或编辑
 */
export const ComplexExprMetaEditModal: React.FC<{
    title?: string,
    triggerName?: string,
    domainId?: number,
    onDone: (meta: ComplexExpressionMeta, newExprId?: number) => void,
    exprId?: number,
    meta?: ComplexExpressionMeta
    cannotChooseOne?: boolean
}> = ({ title, triggerName, domainId, onDone, exprId, meta, cannotChooseOne }) => {
    const initialMeta: ComplexExpressionMeta = {_class: "Complex", metaList:[]}
    
    //传递值时，必须新建一份copy，否则当新建再次打开对话框时，将仍在newMeta上修改，保存时冲掉原来的值
    const [newMeta, setNewMeta] = useState(meta? {...meta} : initialMeta)
    const [newExprId, setNewExprId] = useState(exprId)
    
    const { current } = useRef<{ selectedRecords?: ExpressionRecord[] }>({}) //用于从现有记录中查询名称
  

    //console.log("ComplexExprMetaEditModal, newMeta=",newMeta)

    const formRef = useRef<ProFormInstance>()

    useEffect(() => {
        if (newExprId) {
            const expression: BaseExpressionRecord | undefined = Cache.findOne(ExpressionKeyPrefix + domainId, newExprId, "id")
            const meta = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined
            //console.log("=====update newMeta by newExprId=" + newExprId, meta)

            if (meta) {
                setNewMeta(meta)
                formRef?.current?.setFieldValue("opId", meta?.opId)
            } else {
                //打开Rule Edit中，显示基本和复合表达式的 ”编辑“按钮时，将导致两个对话框初始化，从而执行到此处
                console.log("shold not come here: changed exprId=" + newExprId + ", but no expression or expression.metaStr")
            }
        }

    }, [newExprId])



    return <ModalForm<ComplexExpressionMeta>
        formRef={formRef}
        layout="horizontal"
        title={title || "编辑复合表达式"}
        trigger={<a >{triggerName || "编辑"}</a>}
        autoFocusFirstInput
        omitNil={false} //去掉将不能清除数据，因为需要undfined来清除掉旧数据
        modalProps={{
            destroyOnClose: false,
        }}
        submitTimeout={2000}
        onValuesChange={(v) => {
            // console.log("onValuesChange:" + JSON.stringify(v))
            //现有表达式选择变化 -> 此处执行 -> newExprId变化 -> useEffect中切换 metaList和targetKeys、opId操作符变化 -> UI中transfer变化
            //若是清空，导致transfer左侧使用所有表达式，右侧为空 
            //exprId清空(先不为空，后为空)才执行
            if (newExprId && !v?.exprId) { // 其它字段修改，该条件也成立
                setNewMeta(initialMeta)
                formRef?.current?.setFieldValue("opId", undefined)
            }
            setNewExprId(v?.exprId)

        }}
        onFinish={async (values) => {
            if (!current.selectedRecords || current.selectedRecords.length < 2) {
                message.warning("已选表达式至少2个以上，才可进行逻辑运算")
                return false
            } else {
                if(!values.opId){
                    message.warning("请选择逻辑运算符")
                    return false
                }
                //values.metaList = current.selectedRecords.map((e) => e.meta)
                //values.op = Cache.findOne(LogicalOpKey, values.opId, "id") //opId是form中的一个字段，已在values之中

                newMeta.metaList = current.selectedRecords.map((e) => e.meta) as ExpressionMeta[]
                newMeta.op = Cache.findOne(LogicalOpKey, values.opId, "id") //opId是form中的一个字段，已在values之中
                newMeta.opId = values.opId
                newMeta._class = values._class

                console.log("ComplexExpressionMetaEditorModal: ModalForm.onFinish: onDone=", newMeta);
                
                onDone(newMeta, newExprId)
                return true
            }

        }} >

        <ProFormText hidden name="_class" initialValue="Complex" />

        <ProFormSelect
            name="exprId"
            label="现有复合表达式"
            hidden={cannotChooseOne}
            tooltip="使用现有表达式，或新创建一个"
            request={cannotChooseOne ? undefined : () => asyncSelectProps2Request<BaseExpressionRecord, ExpressionQueryParams>({
                key: ExpressionKeyPrefix + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                url: `${Host}/api/rule/composer/list/expression`,
                query: { domainId: domainId, type: "Complex", pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
                convertFunc: (item) => {
                    return { label: item.label, value: item.id }
                }
            })}
        />

        <Form.Item label="表达式列表" required rules={[{ required: true, message: '必选' }]}>
            <ComplexExprTransfer domainId={domainId} meta={newMeta} onSelectedChange={(keys, records)=> {current.selectedRecords = records}}/>
        </Form.Item>

        <ProFormSelect
            name="opId"
            initialValue={newMeta?.opId}
            tooltip="已选表达式以何种方式进行逻辑运算"
            label="逻辑运算符"
            rules={[{ required: true, message: '必选' }]}

            request={(params) => asyncSelectProps2Request<Opcode, OpcodeQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
                key: LogicalOpKey,//不提供key，则不缓存，每次均从远程请求
                url: `${Host}/api/rule/composer/list/opcode`,
                query: { type: "Logical", pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
                convertFunc: (item) => {
                    return { label: item.label + "(" + item.code + ")", value: item.id }
                }
            })}
        />

    </ModalForm>
}



