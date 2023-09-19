import { Cascader, Form, Select, Space } from "antd"
import { Constant, ConstantQueryParams, Param, ParamCategory, ParamCategoryQueryParams, ParamQueryParams, ParamType, ValueMeta } from "../DataType"
import { JsonValueEditor } from "./JsonValueEditor"
import React, { useEffect, useState } from "react"
import { MyAsyncSelectProps } from "@/myPro/MyProTableProps"
import { cachedFetch, Cache } from "@rwsbillyang/usecache"
import { DefaultOptionType } from "antd/es/select"
import { EnableParamCategory, Host } from "@/Config"


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
    paramType?: ParamType,
    multiple: boolean,
    domainId?: number,
    name: string,
    label: string,
    disabled?: boolean, //如果明确指定为true则disable所有
    constantQueryParams: ConstantQueryParams,
    value?: ValueMeta,
    onChange: (v: ValueMeta) => void
}> = ({ multiple, paramType, domainId, value, name, label, onChange, disabled, constantQueryParams }) => {
    const [paramOptions, setParamOptions] = useState<DefaultOptionType[]>()
    const [constantOptions, setConstantOptions] = useState<CascaderOption[]>()
    const [paramLoading, setParamLoading] = useState(false)
    const [constantLoading, setConstantLoading] = useState(false)

    const paramCategoryAsyncSelectProps: MyAsyncSelectProps<ParamCategory, ParamCategoryQueryParams> = {
        key: "paramCategory/domain/" + domainId + "/type/" + paramType?.id,
        url: `${Host}/api/rule/composer/list/paramCategory`,
        query: { domainId: domainId, typeId: paramType?.id, setupChildren: true, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id , children: item.children?.map((e)=> ({label: e.label, value: e.id}))} }
    }
    const paramAsyncSelectProps: MyAsyncSelectProps<Param, ParamQueryParams> = {
        key: "param/type/" + paramType?.id,
        url: `${Host}/api/rule/composer/list/param`,
        query: { domainId: domainId, typeId: paramType?.id, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
    }

    const constantAsyncSelectProps: MyAsyncSelectProps<Constant, ConstantQueryParams> = {
        key: "constant/t/" + constantQueryParams?.typeIds+"/d/"+domainId + "/ids/"+constantQueryParams.ids, //ConstantQueryParams中的参数各种变化，不仅仅是paramType?.id一种
        url: `${Host}/api/rule/composer/list/constant`,
        query: constantQueryParams,
        convertFunc: (item) => {
            if(item.value) item.jsonValue = JSON.parse(item.value)
            if (item.jsonValue?.value && Array.isArray(item.jsonValue.value)) {
                if(item.isEnum){
                    return { label: item.label, value: item.id, children: item.jsonValue.value.map((e) => { return { label: e.label || e.value , value: e.value } }) }
                }else{
                    return { label: item.label, value: item.id, children: item.jsonValue.value.map((e) => { return { label: e.toString(), value: e } }) }
                }                  
            } else
                return { label: item.label, value: item.id }
        }
    }

    //load select options async
    useEffect(() => {
        //console.log("paramType=", paramType)
        // if (valueMeta?.valueType === 'Param') {
        setParamLoading(true)
        if (EnableParamCategory) {
            cachedFetch<any[]>({
                method: "GET",
                url: paramCategoryAsyncSelectProps.url,
                data: paramCategoryAsyncSelectProps.query,
                shortKey: paramCategoryAsyncSelectProps.key,
                onDone: () => { setParamLoading(false) },
                onOK: (data) => {
                    setParamLoading(false)
                    //setData(data)
                    setParamOptions(data.map((e) => paramCategoryAsyncSelectProps.convertFunc ? paramCategoryAsyncSelectProps.convertFunc(e) : e))
                }
            })
        } else {
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
        }

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

            {
                EnableParamCategory ?
                    <Cascader
                        style={{ width: '20%' }}
                        loading={paramLoading}
                        allowClear
                        value={(value?.paramId && value?.param?.categoryId) ? [value.param.categoryId, value.paramId] : undefined}
                        disabled={disabled ? disabled : value?.valueType !== 'Param'}
                        options={paramOptions}
                        onChange={(v) => {
                            //value是一个数组，存放的分别是select option的value
                            //单选：[1, "乙"] 以及 [4]；
                            console.log("ValueMetaEditor paramId, Cascader.onChange: value=" + JSON.stringify(v))
                            if(v){
                                if (v.length > 1) {
                                    onChange({ ...value, paramId: +v[1] })
                                } else if(v.length > 0) {
                                    onChange({ ...value, paramId: +v[0] })
                                }
                            }else{
                                onChange({ ...value, paramId: undefined })
                            }
                            
                        }}
                    />
                    : <Select
                        style={{ width: '20%' }}
                        loading={paramLoading}
                        allowClear
                        value={value?.paramId || null}
                        //defaultValue={value?.paramId}
                        disabled={disabled ? disabled : value?.valueType !== 'Param'}
                        options={paramOptions}
                        onChange={(v) => {
                            onChange({ ...value, paramId: v, param: Cache.findOne(paramAsyncSelectProps.key || "", v, "id") })
                        }} />
            }


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
                    //console.log("ValueMetaEditor constant, Cascader.onChange: value=" + JSON.stringify(value))
                    //console.log("param?.paramType.code=" + param?.paramType.code)
                    if (v && v.length > 0) {
                        let jsonValue
                        if (multiple) {
                            jsonValue = getJsonValueFromArrayArray(multiple, v, paramType, constantAsyncSelectProps.key)
                        } else {
                            jsonValue = getJsonValueFromArray(multiple, v, paramType, constantAsyncSelectProps.key)
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
                type={multiple ? paramType?.code.replaceAll("Set", "") + "Set" : paramType?.code.replaceAll("Set", "")}
                multiple={multiple === true}

                disabled={disabled ? disabled : value?.valueType !== 'JsonValue'} />
        </Space.Compact>
    </Form.Item>
}

//单选取值：获取选中的值
//arry: 从枚举类型中选[1, 0], [1, "甲"]以及 [4]；
export const getJsonValueFromArray = (multiple: boolean, arry: (string | number)[], paramType?: ParamType, constantKey?: string) => {
    //假定select中value都是id值，事实也是如此
    const constantId = arry[0]
    const constant: Constant | undefined = Cache.findOne(constantKey || "", constantId, "id")
    if (constant) {
        let jsonValue  
        if (arry.length > 1) {
            if (constant.isEnum){
                jsonValue = { value: arry[1], _class: paramType?.code || constant.jsonValue?._class.replaceAll("Enum", "") || "String" }
            }else{
                jsonValue = { value: arry[1], _class: paramType?.code || constant.jsonValue?._class.replaceAll("Set", "") || "String" }
            }
        } else {
            jsonValue = constant?.jsonValue 
        }
  
        if (multiple) {
            jsonValue._class = jsonValue._class.replaceAll("Set", "").replaceAll("Enum", "") + "Set"
        } else {
            jsonValue._class = jsonValue._class.replaceAll("Set", "").replaceAll("Enum", "")
        }
        return jsonValue
    } else {
        console.warn("Shoul not come here, no Constant, id=" + constantId)
    }
    return undefined
}
//arry: 多选选中多个[[1, 2],[1, 2],[1, 2]]，[[1, '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
export const getJsonValueFromArrayArray = (multiple: boolean, arrayArray: (string | number)[][], paramType?: ParamType, constantKey?: string) => {
    const value = arrayArray.flatMap((e) => getJsonValueFromArray(multiple, e, paramType, constantKey)?.value)
        .filter((e) => !!e) //因为e有可能是单个元素也有可能是数组，故使用flatMap 而不是map

    const _class = (paramType?.code.replaceAll("Set", "").replaceAll("Enum", "") || "String") + "Set"

    return { _class, value }
}

