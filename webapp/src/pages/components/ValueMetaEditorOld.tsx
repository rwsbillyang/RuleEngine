import { Cascader, Select } from "antd"
import { BasicExpressionMeta, Constant, ConstantQueryParams, Param, ParamQueryParams } from "../DataType"
import { JsonValueEditor } from "./JsonValueEditor"
import React, { useEffect, useState } from "react"
import { MyAsyncSelectProps } from "@/myPro/MyProTableProps"
import { cachedFetch, Cache } from "@rwsbillyang/usecache"
import { DefaultOptionType } from "antd/es/select"
import { Host } from "@/Config"
import { ProFormFieldSet } from "@ant-design/pro-form"
import useBus, { EventAction } from "use-bus"
import { getJsonValueFromArray, getJsonValueFromArrayArray } from "./ValueMetaEditor"

interface CascaderOption {
    value: string | number;
    label: string;
    children?: CascaderOption[];
}
/**
 * 基本表达式的某个变量与其它值进行比较：其它值可以是常量(Constant)、可以是变量(Param)、也可以是手工输入的任何其它量(JsonValue)
 * 
 * 内部使用的是antd的控件，需自行管理值的变更(将变更后的值记录下来)，最后transform提交时进行转换得到特定的数据结构；若用ProFormSelect则父组件中可得到值的数组，无需自行管理保存编辑的值
 * 
 * 最终得到结果是顶级Form中的name字段值为ValueMeta，即：[name]: ValueMeta
 */
export const ValueMetaEditorOld: React.FC<{
    param?: Param,
    multiple: boolean,
    domainId?: number,
    basicExpressionMeta?: BasicExpressionMeta,
    name: string,
    label: string,
    disabled?: boolean, //如果明确指定为true则disable所有
    constantQueryParams: ConstantQueryParams
}> = ({ multiple, param, domainId, basicExpressionMeta, name, label, disabled, constantQueryParams }) => {
    const [paramOptions, setParamOptions] = useState<DefaultOptionType[]>()
    const [constantOptions, setConstantOptions] = useState<CascaderOption[]>()
    const [paramLoading, setParamLoading] = useState(false)
    const [constantLoading, setConstantLoading] = useState(false)

    const [meta, setMeta] = useState(basicExpressionMeta)


    //父组件ConditionEditor切换exprMeta时，更新了meta，但因为上面useState的存在，导致仍使用的是旧valueMeta
    //因此改用父组件发送event进行更新
    useBus('updateMetaValue', (e: EventAction) => {
        console.log("recv updateMetaValue, payload[" + name + "]: ") //捕捉到的是初始name值，而不是后来实参传递进来的
        //console.log(e.payload)
        setMeta(e.payload)
    })

    const paramAsyncSelectProps: MyAsyncSelectProps<Param, ParamQueryParams> = {
        key: "param/type/" + param?.paramType.id,
        url: `${Host}/api/rule/composer/list/param`,
        query: { domainId: domainId, typeId: param?.paramType.id, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
    }

    const constantAsyncSelectProps: MyAsyncSelectProps<Constant, ConstantQueryParams> = {
        key: "constant/type/" + param?.paramType.id,
        url: `${Host}/api/rule/composer/list/constant`,
        query: constantQueryParams,
        convertFunc: (item) => {
            if (item.isEnum) {
                if (item.jsonValue?.value && Array.isArray(item.jsonValue.value)) {
                    return { label: item.label, value: item.id, children: item.jsonValue.value.map((e) => { return { label: e.toString(), value: e } }) }
                } else
                    return { label: item.label, value: item.id }
            } else
                return { label: item.label, value: item.id }
        }
    }

    const valueMeta = meta ? meta[name] : undefined

    //load select options async
    useEffect(() => {
        console.log("valueMeta?.valueType=" + valueMeta?.valueType)
        // if (valueMeta?.valueType === 'Param') {
        setParamLoading(true)
        cachedFetch<any[]>({
            method: "GET",
            url: paramAsyncSelectProps.url,
            data: paramAsyncSelectProps.query,
            shortKey: paramAsyncSelectProps.key,
            onDone: () => { setParamLoading(false) },
            onOK: (data) => {
                setParamLoading(false)
                //setData(data)
                setParamOptions(data.map((e) => paramAsyncSelectProps.convertFunc ? paramAsyncSelectProps.convertFunc(e) : e))
            }
        })
        //} else if (valueMeta?.valueType === 'Constant') {
        setConstantLoading(true)
        cachedFetch<any[]>({
            method: "GET",
            url: constantAsyncSelectProps.url,
            data: constantAsyncSelectProps.query,
            shortKey: constantAsyncSelectProps.key,
            onDone: () => { setConstantLoading(false) },
            onOK: (data) => {
                setConstantLoading(false)
                //setData(data)
                setConstantOptions(data.map((e) => constantAsyncSelectProps.convertFunc ? constantAsyncSelectProps.convertFunc(e) : e))
            }
        })
        // }

    }, [])

    console.log("ValueMetaEditor: name=" + name)// +", valueMeta=" + JSON.stringify(valueMeta))
    console.log(valueMeta)
    //console.log("valueMeta.jsonValue="+JSON.stringify(valueMeta.jsonValue))

    return <ProFormFieldSet
        name={name}
        type="group"
        label={label}
        //initialValue={oldValue} //initialValue+convertValue 与下面的各字段指定defaultValue效果相同
        transform={(value: any, namePath: string, allValues: any) => {
            //value值为其子控件的值的数组,eg: ["Constant",null,[[1,"甲"],[1,"乙"]]]
            console.log("ValueMetaEditor.transform: name=" + name + ", value=" + JSON.stringify(value) + ", namePath=" + JSON.stringify(namePath))//+ ", allValues=" + JSON.stringify(allValues))


            //Bugfix: 如果没有修改这里面的值， transform有时不会被执行, 因此不会返回任何值，meta应维持不变
            const param: Param | undefined = Cache.findOne(paramAsyncSelectProps.key || "", valueMeta.paramId, "id")
            // let op: Operator | undefined = param?.paramType?.supportOps ? Cache.findOneInArray(param.paramType.supportOps, meta?.opId, "id") : undefined
            // if (!op) op = Cache.findOne("ops/type/" + param?.paramType.id, meta?.opId, "id")
            const obj: BasicExpressionMeta = meta ? meta : { _class: "basic" }
            //obj.op = op

            valueMeta.param = param
            obj[name] = valueMeta

            return { meta: obj }
        }}
    // convertValue={(value)=>{
    //     console.log("convertValue:")
    //     console.log(value)
    //     return [value? [value.valueType, value.paramId, value.constantIds ? JSON.parse(value.constantIds) : null, value.jsonValue]: undefined]
    // }}
    >

        <Select
            style={{ width: '15%' }}
            disabled={disabled}
            allowClear
            defaultValue={valueMeta?.valueType}
            onChange={(v) => {
                const obj: BasicExpressionMeta = meta ? meta : { _class: "basic" }
                obj[name] = { ...valueMeta, valueType: v }
                setMeta(obj)
            }}
            options={[
                { label: "使用变量", value: 'Param' },
                { label: "使用常量", value: 'Constant' },
                { label: "手工输入", value: 'JsonValue' }]}
        />

        <Select
            style={{ width: '20%' }}
            loading={paramLoading}
            allowClear
            defaultValue={valueMeta?.paramId}
            disabled={disabled ? disabled : valueMeta?.valueType !== 'Param'}
            options={paramOptions}
            onChange={(v) => {
                const obj: BasicExpressionMeta = meta ? meta : { _class: "basic" }
                obj[name] = { ...valueMeta, paramId: v }
                setMeta(obj)
            }} />

        <Cascader
            style={{ width: '30%' }}
            disabled={disabled ? disabled : valueMeta?.valueType !== 'Constant'}
            options={constantOptions}
            multiple={multiple}
            maxTagCount="responsive"
            allowClear
            defaultValue={valueMeta?.constantIdsStr ? JSON.parse(valueMeta.constantIdsStr) : undefined}
            loading={constantLoading}
            onChange={(value) => {
                //value是一个数组，存放的分别是select option的value
                //eg：树形select的option的value 
                //单选：[1, "乙"] 以及 [4]；
                //多选选中多个[[1, '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
                console.log("ValueMetaEditor constant, Cascader.onChange: value=" + JSON.stringify(value))
                console.log("param?.paramType.code=" + param?.paramType.code)
                if (value && value.length > 0) {
                    let jsonValue
                    if (multiple) {
                        jsonValue = getJsonValueFromArrayArray(multiple, value, param, constantAsyncSelectProps.key)
                    } else {
                        jsonValue = getJsonValueFromArray(multiple, value, param, constantAsyncSelectProps.key)
                    }
                    const newValueMeta = { ...valueMeta, constantIdsStr: JSON.stringify(value), jsonValue: jsonValue }
                    console.log("newValueMeta=" + JSON.stringify(newValueMeta))
                    const obj: BasicExpressionMeta = meta ? meta : { _class: "basic" }
                    obj[name] = newValueMeta
                    setMeta(obj)

                } else {
                    const obj: BasicExpressionMeta = meta ? meta : { _class: "basic" }
                    obj[name] = { ...valueMeta, constantIdsStr: undefined, jsonValue: undefined }
                    setMeta(obj)
                }

            }}

        />

        <JsonValueEditor width="35%"
            onChange={(v) => { valueMeta.jsonValue = v }}
            type={multiple ? param?.paramType.code.replaceAll("Set", "") + "Set" : param?.paramType.code.replaceAll("Set", "")}
            multiple={multiple === true}
            value={valueMeta?.jsonValue} //TODO: 即使valueMeta.jsonValue被Cascader的onChange更新，此处也仍是旧值
            disabled={disabled ? disabled : valueMeta?.valueType !== 'JsonValue'} />

    </ProFormFieldSet>
}
