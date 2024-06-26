import { asyncSelectProps2Request } from "easy-antd-pro"
import ProForm, {  ModalForm, ProFormDependency, ProFormDigit, ProFormSelect,  ProFormText, ProFormTextArea } from "@ant-design/pro-form"
import React, { useState } from "react"
import { RuleAction, AllDomainKey, Domain, DomainQueryParams, Rule, RuleActionQueryParams, RuleCommon, RuleGroup } from "../DataType"
import { Host } from "@/Config"

import { Button, Form, message } from "antd"



import { RuleName } from "./RuleTable"

import {  InsertNodeResult, getOnInsertNodeOk, saveRuleOrGroup } from "./RuleCommon"
import { basicExpressionMeta2String, complexExpressionMeta2String } from "../utils"
import { BasicExprMetaEditModalV2 } from "../components/BasicExprMetaEditModalV2"
import { ComplexExprMetaEditModal } from "../components/ComplexExprMetaEditModal"
import { RuleGroupName } from "./RuleGroupTable"
import { cachedFetchPromise } from "@rwsbillyang/usecache"



/**
 * 
 * @param isAdd 编辑还是新增
 * @param record 当前需要编辑的值，新增的话可以使用初始值 经transformBeoforeEdit转换的值
 * @param tableProps 表格属性，需要使用里面的title字段
 * @param fromTable 从哪个表格过来
 * @param currentRow 在哪个Rule上新增子项或编辑，若是新增顶级节点则为空
 * @returns 
 */
export const RuleEditModal: React.FC<{
    isAdd: boolean,
    record?: Partial<Rule>,
    fromTable: string,
    currentRow?: RuleCommon
}> = ({ isAdd, record, fromTable, currentRow }) => {

    const [condition, setCondition] = useState<{  meta }>({ meta: record?.meta })

    
    return <ModalForm<Rule> layout="horizontal" initialValues={record}
        title={isAdd? "新增规则" : "编辑规则"}
        trigger={isAdd ? (currentRow ? <span>子规则</span> : <Button type="primary">新建</Button>) : <a key="editLink">编辑</a>}
        omitNil={false} //去掉将不能清除数据，因为需要undfined来清除掉旧数据
        modalProps={{
            destroyOnClose: false,
            //onCancel: () => console.log('run'),
        }}
        submitTimeout={2000}
        onFinish={async (values) => {
            //console.log("RuleEdit onFinish: values=",values);
            //console.log("oldValues:", record);
            if (!values.label) {
                message.warning("请填写名称")
                return false
            }
            if (!condition.meta) {
                message.warning("基本条件和复合条件二选一")
                return false
            } else {
                //values.exprId = condition.exprId
                values.meta = condition.meta

                saveRuleOrGroup(fromTable, RuleName, values, isAdd, record, currentRow)

                return true
            }
        }}>

        <ProFormSelect width="md" name={"domainId"} label="所属" request={() => asyncSelectProps2Request<Domain, DomainQueryParams>({
                key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                url: `${Host}/api/rule/composer/list/domain`,
                query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },
                convertFunc: (item) => { return { label: item.label, value: item.id } }
            })} />
        <ProFormText  name={"label"} label="名称" required />

        <ProForm.Group>
            <ProFormSelect width="xs" name={"exclusive"} fieldProps={{ options: [{value:0, label: "否"}, {value:1, label: "是"}] }} label="排他性" />
            <ProFormSelect width="xs" name={"enable"} fieldProps={{ options: [{value:0, label: "禁用"}, {value:1, label: "可用"}] }}  label="状态" />
            <ProFormDigit width="xs" name={"priority"} label="优先级" min={-10000}/>
            <ProFormDigit width="xs" name={"threshhold"} label="可信度" />
        </ProForm.Group>


        <ProFormDependency name={["domainId"]}>
            {({ domainId }) => {
                return <>
                    <Form.Item label="基本条件" tooltip="基本条件和复合条件二选一">
                        {basicExpressionMeta2String(condition.meta)} <BasicExprMetaEditModalV2 onDone={(meta, exprId) => setCondition({ meta })}
                            domainId={domainId}  meta={condition.meta?._class === "Basic" ? condition.meta : undefined} />
                    </Form.Item>
                    <Form.Item label="复合条件" tooltip="基本条件和复合条件二选一">
                        {complexExpressionMeta2String(condition.meta)} <ComplexExprMetaEditModal onDone={(meta, exprId) => setCondition({ meta })}
                            domainId={domainId}  meta={condition.meta?._class === "Complex" ? condition.meta : undefined} />
                    </Form.Item>
                </>
            }}
        </ProFormDependency>
        <ProFormText name={"exprRemark"} label="表达式备注" tooltip="对表达式的备注说明"/>

        <ProForm.Group>
            <ProFormSelect width="md" name={"thenAction"} label="Then动作" tooltip="条件为true时执行"
                request={() => asyncSelectProps2Request<RuleAction, RuleActionQueryParams>({
                    key: "allActions", //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                    url: `${Host}/api/rule/composer/list/action`,
                    convertFunc: (item) => { return { label: item.label || item.actionKey, value: item.actionKey } }
                })} />
            <ProFormSelect width="md" name={"elseAction"} label="Else动作" tooltip="条件为false时执行"
                request={() => asyncSelectProps2Request<RuleAction, RuleActionQueryParams>({
                    key: "allActions", //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                    url: `${Host}/api/rule/composer/list/action`,
                    convertFunc: (item) => { return { label: item.label || item.actionKey, value: item.actionKey } }
                })} />
        </ProForm.Group>
        <ProFormSelect name={"tagList"} label="标签" fieldProps={{ mode: "tags" }} />
        <ProFormTextArea name={"description"} label="说明" />
        <ProFormTextArea name={"remark"} label="备注" fieldProps={{ rows: 6 }}/>
    </ModalForm>
}

export const RuleGroupEditModal: React.FC<{
    isAdd: boolean,
    record?: Partial<RuleGroup>,
    fromTable: string,
    currentRow?: RuleCommon
}> = ({ isAdd, record, fromTable, currentRow }) => {

    const [condition, setCondition] = useState<{  meta }>({ meta: record?.meta })

    
    return <ModalForm<RuleGroup> layout="horizontal" initialValues={record}
        title={isAdd? "新增规则组" : "编辑规则组"}
        trigger={isAdd ? (currentRow ? <span>子规则组</span> : <Button type="primary">新建</Button>) : <a key="editLink">编辑</a>}
        omitNil={false} //去掉将不能清除数据，因为需要undfined来清除掉旧数据
        modalProps={{
            destroyOnClose: false,
            //onCancel: () => console.log('run'),
        }}
        submitTimeout={2000}
        onFinish={async (values) => {
            //console.log("RuleEdit onFinish: values=",values);
            //console.log("oldValues:", record);
            if (!values.label) {
                message.warning("请填写名称")
                return false
            }

            //values.exprId = condition.exprId
            values.meta = condition.meta

            saveRuleOrGroup(fromTable, RuleGroupName, values, isAdd, record, currentRow)

            return true
        }}>

        <ProFormSelect width="md" name={"domainId"} label="所属" request={() => asyncSelectProps2Request<Domain, DomainQueryParams>({
                key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                url: `${Host}/api/rule/composer/list/domain`,
                query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },
                convertFunc: (item) => { return { label: item.label, value: item.id } }
            })} />
        <ProFormText  name={"label"} label="名称" required />

        <ProForm.Group>
            <ProFormSelect width="xs" name={"exclusive"} fieldProps={{ options: [{value:0, label: "否"}, {value:1, label: "是"}] }} label="排他性" />
            <ProFormSelect width="xs" name={"enable"} fieldProps={{ options: [{value:0, label: "禁用"}, {value:1, label: "可用"}] }}  label="状态" />
            <ProFormDigit width="xs" name={"priority"} label="优先级" min={-10000}/>
        </ProForm.Group>


        <ProFormDependency name={["domainId"]}>
            {({ domainId }) => {
                return <>
                    <Form.Item label="基本条件" tooltip="基本条件和复合条件二选一">
                        {basicExpressionMeta2String(condition.meta)} <BasicExprMetaEditModalV2 onDone={(meta, exprId) => setCondition({ meta })}
                            domainId={domainId}  meta={condition.meta?._class === "Basic" ? condition.meta : undefined} />
                    </Form.Item>
                    <Form.Item label="复合条件" tooltip="基本条件和复合条件二选一">
                        {complexExpressionMeta2String(condition.meta)} <ComplexExprMetaEditModal onDone={(meta, exprId) => setCondition({ meta })}
                            domainId={domainId}  meta={condition.meta?._class === "Complex" ? condition.meta : undefined} />
                    </Form.Item>
                </>
            }}
        </ProFormDependency>
        <ProFormText name={"exprRemark"} label="表达式备注" tooltip="对表达式的备注说明"/>
        <ProFormSelect name={"tagList"} label="标签" fieldProps={{ mode: "tags" }} />
        <ProFormTextArea name={"remark"} label="备注" fieldProps={{ rows: 6 }}/>
    </ModalForm>
}

export const AddParentModal: React.FC<{ currentRow: RuleCommon, fromTable: string}> = ({ currentRow, fromTable }) => {
    const ruleId = currentRow.rule?.id

    return <ModalForm<RuleGroup> layout="horizontal" 
        title="添加父节点ID" 
        trigger={<a key="editLink">添加父节点ID</a>}
        modalProps={{
            destroyOnClose: false,
        }}
        submitTimeout={2000}
        onFinish={async (values) => {
    
            if(!ruleId){
                message.warning("no ruleId")
                return false
            }
            if (!values.parentType || !values.parentId) {
                message.warning("请填写parentType和ID")
                return false
            }
        
            cachedFetchPromise<InsertNodeResult>(`/api/rule/composer/addRuleInParent/${values.parentType}/${values.parentId}/${ruleId}`, 'POST')//undefined, StorageType.OnlySessionStorage, undefined,undefined,false
            .then((data) => {
              if (data) {
                const onOK = getOnInsertNodeOk(fromTable, true, false, currentRow)
                onOK(data)
              }else { console.log("no data return after save") }
              
              return new Promise((resolve) => { resolve(true) });
            }).catch((err) => {
              console.warn("exception: " + err.message)
              message.error(err.message)
            })

            return true
        }}>

        <ProFormSelect name={"parentType"} fieldProps={{ options: [{value:"rule", label: "规则"}, {value:"ruleGroup", label: "规则组"}] }} label="父节点类型" />
        <ProFormDigit name={"parentId"} label="父节点ID" />
    </ModalForm>
}


export const AddChildModal: React.FC<{ currentRow: RuleCommon, fromTable: string}> = ({ currentRow, fromTable }) => {
    let parentId =  currentRow.ruleGroup?.id
    let parentType = RuleGroupName
    if(currentRow.rule){
        parentType = RuleName
        parentId = currentRow.rule?.id 
    }

    return <ModalForm<RuleGroup> layout="horizontal" 
        title="添加子节点ID" 
        trigger={<a key="editLink">添加子节点ID</a>}
        modalProps={{
            destroyOnClose: false,
        }}
        submitTimeout={2000}
        onFinish={async (values) => {
    
            if(!parentType || !parentId){
                message.warning("no parentType or parentId")
                return false
            }

            const ruleId = values.ruleId
            if (!ruleId) {
                message.warning("请填写ID")
                return false
            }
        
            cachedFetchPromise<InsertNodeResult>(`/api/rule/composer/addRuleInParent/${parentType}/${parentId}/${ruleId}`, 'POST')//undefined, StorageType.OnlySessionStorage, undefined,undefined,false
            .then((data) => {
              if (data) {
                const onOK = getOnInsertNodeOk(fromTable, true, false, currentRow)
                onOK(data)
              }else { console.log("no data return after save") }
              
              return new Promise((resolve) => { resolve(true) });
            }).catch((err) => {
              console.warn("exception: " + err.message)
              message.error(err.message)
            })

            return true
        }}>

    
        <ProFormDigit name={"ruleId"} label="子节点ID" />
    </ModalForm>
}

// export const RuleGroupEditModalOld: React.FC<{
//     isAdd: boolean,
//     record?: Partial<RuleGroup>,
//     fromTable: string,
//     currentRow?: RuleCommon
// }> = ({ isAdd, record, fromTable, currentRow }) => {


//     return <BetaSchemaForm<RuleGroup>
//         title="编辑规则组"
//         trigger={isAdd ? (currentRow ? <span>子规则组</span> : <Button type="primary">新建</Button>) : <a key="editLink">编辑</a>}
//         layoutType="ModalForm"
//         initialValues={record}
//         columns={ruleGroupColumns as any}
//         onFinish={async (values) => {
//             saveRuleOrGroup(fromTable, RuleGroupName, values, isAdd, record, currentRow)
//             return true
//         }}
//         layout="horizontal"
//     />
// }
/**
 * @deprecated
 * 新的页面中打开编辑, 不再更新维护
 */
// export const RuleEdit = () => {
//     const navigate = useNavigate();
//     const { state } = useLocation();
//     //const { record, isAdd } = state
//     //console.log(JSON.stringify(state))
//     let record, isAdd
//     if (state) {
//         record = state.record
//         isAdd = state.isAdd
//     }

//     const [condition, setCondition] = useState<{ exprId, meta }>({ exprId: record?.exprId, meta: record?.meta })

//     return <ProForm<Rule> layout="horizontal" initialValues={record}
//         submitter={{
//             render: (props, doms) => doms.concat(<Button htmlType="button" onClick={() => { navigate(-1) }} key="back">返回</Button>),
//         }}
//         onFinish={async (values) => {
//             //values.exprId = condition.exprId
//             values.meta = condition.meta
//             console.log("RuleEdit onFinish: values=");
//             console.log(values);

//             //新增也有可能相同的条件，从而id相同，算是更新，因此都有
//             //saveOne(values, rubleTableProps, undefined, record)
//             saveRuleOrGroup(RuleName, RuleName, values, isAdd, record)

//             navigate(-1)

//             return true
//         }}>

//         <ProForm.Group>
//             <ProFormSelect width="md" name={"domainId"} label="所属" request={() => asyncSelectProps2Request<Domain, DomainQueryParams>({
//                 key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
//                 url: `${Host}/api/rule/composer/list/domain`,
//                 query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },
//                 convertFunc: (item) => { return { label: item.label, value: item.id } }
//             })} />
//             <ProFormText width="md" name={"label"} label="名称" required />

//         </ProForm.Group>

//         <ProForm.Group>
//             <ProFormSwitch width="xs" name={"enable"} label="状态" />
//             <ProFormDigit width="xs" name={"priority"} label="优先级" />
//             <ProFormDigit width="xs" name={"threshhold"} label="可信度" />
//         </ProForm.Group>


//         <ProFormDependency name={["domainId"]}>
//             {({ domainId }) => {
//                 return <>
//                     <Form.Item label="基本条件" tooltip="基本条件和复合条件二选一">
//                         {basicExpressionMeta2String(condition.meta)} <BasicExprMetaEditModalV2 onDone={(meta, exprId) => setCondition({ meta, exprId })}
//                             domainId={domainId}  meta={condition.meta} />
//                     </Form.Item>
//                     <Form.Item label="复合条件" tooltip="基本条件和复合条件二选一">
//                         {complexExpressionMeta2String(condition.meta)} <ComplexExprMetaEditModal onDone={(meta, exprId) => setCondition({ meta, exprId })}
//                             domainId={domainId} meta={condition.meta} />
//                     </Form.Item>
//                 </>
//             }}
//         </ProFormDependency>

//         <ProForm.Group>
//             <ProFormSelect width="md" name={"thenAction"} label="Then动作" tooltip="条件为true时执行"
//                 required
//                 request={() => asyncSelectProps2Request<RuleAction, RuleActionQueryParams>({
//                     key: "allActions", //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
//                     url: `${Host}/api/rule/composer/list/action`,
//                     convertFunc: (item) => { return { label: item.label || item.actionKey, value: item.actionKey } }
//                 })} />
//             <ProFormSelect width="md" name={"elseAction"} label="Else动作" tooltip="条件为false时执行"
//                 request={() => asyncSelectProps2Request<RuleAction, RuleActionQueryParams>({
//                     key: "allActions", //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
//                     url: `${Host}/api/rule/composer/list/action`,
//                     convertFunc: (item) => { return { label: item.label || item.actionKey, value: item.actionKey } }
//                 })} />
//         </ProForm.Group>
//         <ProFormSelect name={"tagList"} label="标签" fieldProps={{ mode: "tags" }} />
//         <ProFormTextArea name={"remark"} label="备注" />
//     </ProForm>
// }
