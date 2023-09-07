import { Cascader, Form, Select, Space } from "antd"
import {  Constant, ConstantQueryParams, Param, ParamQueryParams, ValueMeta } from "../DataType"
import { JsonValueEditor } from "./JsonValueEditor"
import React, { useEffect, useState } from "react"
import { MyAsyncSelectProps } from "@/myPro/MyProTableProps"
import { cachedFetch, Cache } from "@rwsbillyang/usecache"
import { DefaultOptionType } from "antd/es/select"
import { Host } from "@/Config"


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
 * 
 * bugfix: 里面的字段UI全部是受控组件, 用于解决灰色（使用现有表达式）时指定表达式的meta值而UI不能更新的问题
*/
export const ValueMetaEditor: React.FC<{
    param?: Param,
    multiple: boolean,
    domainId?: number,
    name: string,
    label: string,
    disabled?: boolean, //如果明确指定为true则disable所有
    constantQueryParams: ConstantQueryParams,
    value?: ValueMeta,
    onChange: (v: ValueMeta) => void
}> = ({ multiple, param, domainId, value, name, label, onChange, disabled, constantQueryParams }) => {
    const [paramOptions, setParamOptions] = useState<DefaultOptionType[]>()
    const [constantOptions, setConstantOptions] = useState<CascaderOption[]>()
    const [paramLoading, setParamLoading] = useState(false)
    const [constantLoading, setConstantLoading] = useState(false)


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

    //load select options async
    useEffect(() => {
        //console.log("value?.valueType=" + value?.valueType)
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

    //console.log("ValueMetaEditor: name=" + name)// +", valueMeta=" + JSON.stringify(valueMeta))
    //console.log(value)
    //console.log("valueMeta.jsonValue="+JSON.stringify(valueMeta.jsonValue))

    return <Form.Item label={label}>
        <Space.Compact style={{ width: '100%' }}>
            <Select
                style={{ width: '15%' }}
                disabled={disabled}
                allowClear
                value={value?.valueType || null}
                //defaultValue={value?.valueType}
                onChange={(v) => {
                    onChange({ valueType: v }) //清空原所有的值
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
                value={value?.paramId || null}
                //defaultValue={value?.paramId}
                disabled={disabled ? disabled : value?.valueType !== 'Param'}
                options={paramOptions}
                onChange={(v) => {
                    onChange({ ...value, paramId: v, param: Cache.findOne(paramAsyncSelectProps.key || "", v, "id")})
                }} />

            <Cascader
                style={{ width: '30%' }}
                disabled={disabled ? disabled : value?.valueType !== 'Constant'}
                options={constantOptions}
                multiple={multiple}
                maxTagCount="responsive"
                allowClear
                value={value?.constantIdsStr ? JSON.parse(value.constantIdsStr) : null}
                //defaultValue={value?.constantIdsStr ? JSON.parse(value.constantIdsStr) : undefined}
                loading={constantLoading}
                onChange={(v) => {
                    //value是一个数组，存放的分别是select option的value
                    //eg：树形select的option的value 
                    //单选：[1, "乙"] 以及 [4]；
                    //多选选中多个[[1, '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
                    console.log("ValueMetaEditor constant, Cascader.onChange: value=" + JSON.stringify(value))
                    console.log("param?.paramType.code=" + param?.paramType.code)
                    if (v && v.length > 0) {
                        let jsonValue
                        if (multiple) {
                            jsonValue = getJsonValueFromArrayArray(multiple, v, param, constantAsyncSelectProps.key)
                        } else {
                            jsonValue = getJsonValueFromArray(multiple, v, param, constantAsyncSelectProps.key)
                        }
                        onChange({ ...value, constantIds: v, constantIdsStr: JSON.stringify(v), jsonValue: jsonValue })
                    } else {
                        onChange({ ...value, constantIds: v, constantIdsStr: undefined, jsonValue: undefined })
                    }
                }}

            />

            <JsonValueEditor width="35%"
                value={value?.jsonValue} //TODO: 即使valueMeta.jsonValue被Cascader的onChange更新，此处也仍是旧值
                onChange={(v) => { onChange({ ...value, jsonValue: v }) }}
                type={multiple ? param?.paramType.code.replaceAll("Set", "") + "Set" : param?.paramType.code.replaceAll("Set", "")}
                multiple={multiple === true}
                
                disabled={disabled ? disabled : value?.valueType !== 'JsonValue'} />
        </Space.Compact>
    </Form.Item>
}

//arry: 单选：[1, "乙"] 以及 [4]；
export const getJsonValueFromArray = (multiple: boolean, arry: (string | number)[], param?: Param, constantKey?: string) => {
    //假定select中value都是id值，事实也是如此
    const constantId = arry[0]
    const constant: Constant | undefined = Cache.findOne(constantKey || "", constantId, "id")
    if (constant) {
        let jsonValue
        if (constant.isEnum) {
            if (arry.length > 1) {
                jsonValue = { value: arry[1], _class: param?.paramType.code || constant.jsonValue?._class || "String" }
            } else {
                jsonValue = constant?.jsonValue //此时其值为数组
            }
        } else {
            jsonValue = constant?.jsonValue //值可能为数组也可能为单个元素值
        }
        if (multiple) {
            jsonValue._class = jsonValue._class.replaceAll("Set", "") + "Set"
        } else {
            jsonValue._class = jsonValue._class.replaceAll("Set", "")
        }
        return jsonValue
    } else {
        console.warn("Shoul not come here, no Constant, id=" + constantId)
    }
    return undefined
}
//arry: 多选选中多个[[1, '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
export const getJsonValueFromArrayArray = (multiple: boolean, arrayArray: (string | number)[][], param?: Param, constantKey?: string) => {
    const value = arrayArray.flatMap((e) => getJsonValueFromArray(multiple, e, param, constantKey)?.value)
        .filter((e) => !!e) //因为e有可能是单个元素也有可能是数组，故使用flatMap 而不是map

    const _class = (param?.paramType.code.replaceAll("Set", "") || "String") + "Set"

    return { _class, value }
}

