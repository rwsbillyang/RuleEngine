import { MyProTableProps, asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import ProForm, { ModalForm, ProFormDependency, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from "@ant-design/pro-form"
import React, { useState } from "react"
import { RuleAction, AllDomainKey, Domain, DomainQueryParams, Rule, basicExpressionMeta2String, RuleActionQueryParams, RuleQueryParams, RuleGroup, RuleCommon } from "../DataType"
import { Host } from "@/Config"
import { Condition, ConditionEditor } from "../components/ConditionEditor"
import { useLocation, useNavigate } from "react-router-dom"
import { Button, Form } from "antd"

import { RuleName } from "./RuleTable"

import { saveRuleOrGroup } from "./RuleCommon"


/**
 * 
 * @param isAdd 编辑还是新增
 * @param record 当前需要编辑的值，新增的话可以使用初始值 经transformBeoforeEdit转换的值
 * @param tableProps 表格属性，需要使用里面的title字段
 * @param fromTable 从哪个表格过来
 * @param parentRule 父rule，当在rule中新增子规则时非空
 * @param parentRuleGroup 父ruleGroup，当在group中新增子规则时非空
 * @returns 
 */
export const RuleEditModal: React.FC<{
    isAdd: boolean,
    record?: Partial<Rule>,
    tableProps: MyProTableProps<Rule, RuleQueryParams>,
    fromTable: string,
    parentRuleCommon?: RuleCommon, 
    parentGroupCommon?: RuleCommon
}> = ({ isAdd, record, tableProps, fromTable, parentRuleCommon, parentGroupCommon }) => {

        const [condition, setCondition] = useState<Condition>({ exprId: record?.exprId, meta: record?.metaStr ? JSON.parse(record.metaStr) : undefined })

        return <ModalForm<Rule> layout="horizontal" initialValues={record}
        title={tableProps.myTitle}
        trigger={isAdd ? ((parentRuleCommon || parentGroupCommon)? <span>子规则</span> : <Button type="primary">新建</Button>) : <a key="editLink">编辑</a>}
            autoFocusFirstInput
            modalProps={{
                destroyOnClose: false,
                //onCancel: () => console.log('run'),
            }}
            submitTimeout={2000}
            onFinish={async (values) => {
                values.exprId = condition.exprId
                values.meta = condition.meta
                //console.log("RuleEdit onFinish: values=");
                //console.log("oldValues:", record);

                saveRuleOrGroup(fromTable, RuleName, values, isAdd, record, parentRuleCommon, parentGroupCommon)
            
                return true
            }}>

            <ProForm.Group>
                <ProFormSelect width="md" name={"domainId"} label="所属" request={() => asyncSelectProps2Request<Domain, DomainQueryParams>({
                    key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                    url: `${Host}/api/rule/composer/list/domain`,
                    query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },
                    convertFunc: (item) => { return { label: item.label, value: item.id } }
                })} />
                <ProFormText width="md" name={"label"} label="名称" required />

            </ProForm.Group>

            <ProForm.Group>
                <ProFormSwitch width="xs" name={"enable"} label="状态" />
                <ProFormDigit width="xs" name={"priority"} label="优先级" />
                <ProFormDigit width="xs" name={"threshhold"} label="可信度" />
            </ProForm.Group>



            <ProFormDependency name={["domainId"]}>
                {({ domainId }) => {
                    return <Form.Item label="条件" required>
                        {basicExpressionMeta2String(condition.meta)} <ConditionEditor onDone={setCondition}
                            domainId={domainId} exprId={condition.exprId} meta={condition.meta} />
                    </Form.Item>
                }}
            </ProFormDependency>

            <ProForm.Group>
                <ProFormSelect width="md" name={"thenAction"} label="Then动作" tooltip="条件为true时执行"
                    required
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
            <ProFormTextArea name={"remark"} label="备注" />
        </ModalForm>
    }



/**
 * @deprecated
 * 新的页面中打开编辑, 不再更新维护
 */
export const RuleEdit = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    //const { record, isAdd } = state
    //console.log(JSON.stringify(state))
    let record, isAdd
    if (state) {
        record = state.record
        isAdd = state.isAdd
    }

    const [condition, setCondition] = useState<Condition>({ exprId: record?.exprId, meta: record?.metaStr ? JSON.parse(record.metaStr) : undefined })

    return <ProForm<Rule> layout="horizontal" initialValues={record}
        submitter={{
            render: (props, doms) => doms.concat(<Button htmlType="button" onClick={() => { navigate(-1) }} key="back">返回</Button>),
        }}
        onFinish={async (values) => {
            values.exprId = condition.exprId
            values.meta = condition.meta
            console.log("RuleEdit onFinish: values=");
            console.log(values);

            //新增也有可能相同的条件，从而id相同，算是更新，因此都有
            //saveOne(values, rubleTableProps, undefined, record)
            saveRuleOrGroup(RuleName, RuleName, values, isAdd, record)

            navigate(-1)

            return true
        }}>

        <ProForm.Group>
            <ProFormSelect width="md" name={"domainId"} label="所属" request={() => asyncSelectProps2Request<Domain, DomainQueryParams>({
                key: AllDomainKey, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                url: `${Host}/api/rule/composer/list/domain`,
                query: { pagination: { pageSize: -1, sKey: "id", sort: 1 } },
                convertFunc: (item) => { return { label: item.label, value: item.id } }
            })} />
            <ProFormText width="md" name={"label"} label="名称" required />

        </ProForm.Group>

        <ProForm.Group>
            <ProFormSwitch width="xs" name={"enable"} label="状态" />
            <ProFormDigit width="xs" name={"priority"} label="优先级" />
            <ProFormDigit width="xs" name={"threshhold"} label="可信度" />
        </ProForm.Group>



        <ProFormDependency name={["domainId"]}>
            {({ domainId }) => {
                return <Form.Item label="条件" required>
                    {basicExpressionMeta2String(condition.meta)} <ConditionEditor onDone={setCondition}
                        domainId={domainId} exprId={condition.exprId} meta={condition.meta} />
                </Form.Item>
            }}
        </ProFormDependency>

        <ProForm.Group>
            <ProFormSelect width="md" name={"thenAction"} label="Then动作" tooltip="条件为true时执行"
                required
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
        <ProFormTextArea name={"remark"} label="备注" />
    </ProForm>
}
