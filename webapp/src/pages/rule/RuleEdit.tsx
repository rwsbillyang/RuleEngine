import { asyncSelectProps2Request } from "@/myPro/MyProTableProps"
import ProForm, { ProFormDependency, ProFormDigit, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea } from "@ant-design/pro-form"
import React, { useState } from "react"
import { RuleAction, AllDomainKey, Domain, DomainQueryParams, Rule, basicExpressionMeta2String, RuleActionQueryParams } from "../DataType"
import { Host } from "@/Config"
import { Condition, ConditionEditor } from "../components/ConditionEditor"
import { useLocation, useNavigate } from "react-router-dom"
import { Form } from "antd"
import { saveOne } from "@/myPro/MyProTable"
import { rubleTableProps } from "./RuleTable"

export const RuleEdit = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    //console.log(JSON.stringify(state))
    const {record, isAdd} = state
    const [condition, setCondition] = useState<Condition>({exprId: record?.exprId, meta: record?.metaStr? JSON.parse(record.metaStr): undefined})

    return <ProForm<Rule> layout="horizontal" initialValues={record} 
    onFinish={async (values) => {
        values.exprId = condition.exprId
        values.meta = condition.meta
        console.log("RuleEdit onFinish: values=");
        console.log(values);
        saveOne(values, rubleTableProps, isAdd, record)
       
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
            <ProFormText width="md" name={"label"} label="名称" />

        </ProForm.Group>

        <ProForm.Group>
            <ProFormSwitch width="xs" name={"enable"} label="状态" />
            <ProFormDigit width="xs" name={"priority"} label="优先级" />
            <ProFormDigit width="xs" name={"threshhold"} label="可信度" />
        </ProForm.Group>

        <ProFormSelect name={"tagList"} label="标签" fieldProps={{ mode: "tags" }} />

        <ProFormDependency name={["domainId"]}>
            {({ domainId }) => {
                return <Form.Item label="条件">
                     {basicExpressionMeta2String(condition.meta)} <ConditionEditor onDone={setCondition}
                      domainId={domainId} exprId={condition.exprId} meta={condition.meta} />
                </Form.Item> 
            }}
        </ProFormDependency>

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

        <ProFormTextArea name={"remark"} label="备注" />
    </ProForm>
}
