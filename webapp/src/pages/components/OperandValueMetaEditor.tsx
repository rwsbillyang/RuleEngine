import { Cascader, Form, Select, Space } from "antd"
import { Constant, ConstantQueryParams, OperandConfig, Param, ParamCategory, ParamCategoryQueryParams, ParamQueryParams, ParamType, OperandValueMeta, JsonValue, LabelValue } from "../DataType"
import { JsonValueEditor } from "./JsonValueEditor"
import React, { useEffect, useState } from "react"
import { MyAsyncSelectProps } from "@/myPro/MyProTableProps"
import { cachedFetch, Cache, TreeCache } from "@rwsbillyang/usecache"
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
 * 最终得到结果是顶级Form中的name字段值为OperandValueMeta，即：[name]: OperandValueMeta
 * 
 * bugfix: 里面的字段UI全部是受控组件, 用于解决灰色（使用现有表达式）时指定表达式的meta值而UI不能更新的问题
*/
export const OperandValueMetaEditor: React.FC<{
    paramType?: ParamType,
    operandConfig: OperandConfig,
    constantQueryParams: ConstantQueryParams,
    domainId?: number,
    disabled?: boolean, //如果明确指定为true则disable所有
    value?: OperandValueMeta,
    onChange: (v: OperandValueMeta) => void
}> = ({ paramType, operandConfig, constantQueryParams, domainId, disabled, value, onChange }) => {
    const [paramOptions, setParamOptions] = useState<DefaultOptionType[]>()
    const [constantOptions, setConstantOptions] = useState<CascaderOption[]>()
    const [paramLoading, setParamLoading] = useState(false)
    const [constantLoading, setConstantLoading] = useState(false)

    const multiple = operandConfig.multiple
    // console.log("OperandValueMetaEditor, paramType=",paramType)

    //变量加载只是与paramType同类型的变量
    const paramCategoryAsyncSelectProps: MyAsyncSelectProps<ParamCategory, ParamCategoryQueryParams> = {
        key: "paramCategory/domain/" + domainId + "/type/" + paramType?.id,
        url: `${Host}/api/rule/composer/list/paramCategory`,
        query: { domainId: domainId, typeId: paramType?.id, setupChildren: true, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id, children: item.children?.map((e) => ({ label: e.label, value: e.id })) } }
    }
    const paramAsyncSelectProps: MyAsyncSelectProps<Param, ParamQueryParams> = {
        key: "param/type/" + paramType?.id,
        url: `${Host}/api/rule/composer/list/param`,
        query: { domainId: domainId, typeId: paramType?.id, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
        convertFunc: (item) => { return { label: item.label, value: item.id } }
    }

    //常量加载，可能是同类型，更可能是值域，作为参数由constantQueryParams传递过来
    const constantAsyncSelectProps: MyAsyncSelectProps<Constant, ConstantQueryParams> = {
        key: "constant/t/" + constantQueryParams?.typeIds + "/d/" + domainId + "/ids/" + constantQueryParams.ids, //ConstantQueryParams中的参数各种变化，不仅仅是paramType?.id一种
        url: `${Host}/api/rule/composer/list/constant`,
        query: constantQueryParams,
        convertFunc: (item) => {
            if (item.value) item.jsonValue = JSON.parse(item.value)
            if (item.jsonValue?.value && Array.isArray(item.jsonValue.value)) {
                if (item.isEnum) {
                    //某些枚举值，如整数枚举，值可能需要创建标签，LabelValue是因为常量中枚举值类型
                    return { label: item.label, value: item.id, children: item.jsonValue.value.map((e) => { return { label: e.label || e.value, value: e.value } }) }
                } else {
                    return { label: item.label, value: item.id, children: item.jsonValue.value.map((e) => { return { label: e.toString(), value: e } }) }
                }
            } else
                return { label: item.label, value: item.id }
        }
    }

    //load select options async
    useEffect(() => {
        //console.log("paramType=", paramType)
        // if (OperandValueMeta?.valueType === 'Param') {
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

        //} else if (OperandValueMeta?.valueType === 'Constant') {
        if (EnableParamCategory && (!operandConfig.selectOptions || operandConfig.selectOptions.length === 0)) {
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
        }

        // }

    }, [])

    //console.log("OperandValueMetaEditor: name=" + name)// +", OperandValueMeta=" + JSON.stringify(OperandValueMeta))
    //console.log("OperandValueMetaEditor,value=",value)
    //console.log("OperandValueMeta.jsonValue="+JSON.stringify(OperandValueMeta.jsonValue))

    return <Form.Item label={operandConfig.label} tooltip={operandConfig.tooltip} required={operandConfig.required}>
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
                        style={{ width: '35%' }}
                        loading={paramLoading}
                        allowClear
                        value={(value?.paramId as any || null)}
                        disabled={disabled ? disabled : value?.valueType !== 'Param'}
                        options={paramOptions}
                        onChange={(v) => {
                            //value是一个数组，存放的分别是select option的value
                            //单选：[1, 0] 以及 [4]；
                            //console.log("OperandValueMetaEditor paramId, Cascader.onChange: value=", v)
                            if (v) {
                                const key = paramCategoryAsyncSelectProps.key || ""
                                const elems: Param[] | undefined = TreeCache.getElementsByPathIdsInTreeFromCache(key, v, "id")
                                if (!elems || elems.length !== 2) {
                                    console.warn("not found category-param, key=" + key + ", path=" + JSON.stringify(v) + ",elems=", elems) //没有找到分类-变量
                                } else {
                                    onChange({ ...value, paramId: v as number[], param: elems[1] })
                                }
                            } else {
                                onChange({ ...value, paramId: undefined })
                            }

                        }}
                    />
                    : <Select
                        style={{ width: '35%' }}
                        loading={paramLoading}
                        allowClear
                        value={value?.paramId || null}
                        //defaultValue={value?.paramId}
                        disabled={disabled ? disabled : value?.valueType !== 'Param'}
                        options={paramOptions}
                        onChange={(v) => {
                            onChange({ ...value, paramId: v, param: Cache.findOne(paramAsyncSelectProps.key || "", v as number, "id") })
                        }} />
            }

            {
                (operandConfig.selectOptions && operandConfig.selectOptions.length > 0) ?
                    <Select value={value?.constantIds as string | number | (string | number)[] || operandConfig.defaultSelect || null}
                        disabled={disabled ? disabled : value?.valueType !== 'Constant'}
                        options={operandConfig.selectOptions}
                        mode={operandConfig.multiple ? 'multiple' : undefined}
                        onChange={(v) => {
                            if (v) {
                                onChange({ ...value, constantIds: v, jsonValue: {value: v, _class: "String"} })
                            } else {
                                onChange({ ...value, constantIds: undefined, jsonValue: undefined })
                            }
                        }} /> : <Cascader
                        style={{ width: '30%' }}
                        disabled={disabled ? disabled : value?.valueType !== 'Constant'}
                        options={constantOptions}
                        multiple={multiple}
                        maxTagCount="responsive"
                        allowClear
                        value={value?.constantIds as any || null}
                        loading={constantLoading}
                        onChange={(v) => {
                            //value是一个数组，存放的分别是select option的value
                            //eg：树形select的option的value 
                            //单选：[1, "乙"] 以及 [4]；
                            //多选选中多个[[1, '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
                            //console.log("OperandValueMetaEditor constant, Cascader.onChange:multiple="+ multiple + ", v=", v)
                        
                            if (v && v.length > 0) {
                                const constants: Constant[] = []
                                let jsonValue
                                if (multiple) {
                                    jsonValue = getJsonValueFromArrayArray(constants, multiple, v, paramType, constantAsyncSelectProps.key)
                                } else {
                                    jsonValue = getJsonValueFromArray(constants, multiple, v, paramType, constantAsyncSelectProps.key)
                                }

                                onChange({ ...value, constantIds: v, jsonValue: jsonValue })
                            } else {
                                onChange({ ...value, constantIds: undefined, jsonValue: undefined })
                            }
                        }}
                    />
            }

            <JsonValueEditor width="20%"
                value={value?.jsonValue} //TODO: 即使OperandValueMeta.jsonValue被Cascader的onChange更新，此处也仍是旧值
                onChange={(v) => { onChange({ ...value, jsonValue: v }) }}
                type={multiple ? paramType?.code.replaceAll("Set", "") + "Set" : paramType?.code.replaceAll("Set", "")}
                multiple={multiple === true}

                disabled={disabled ? disabled : value?.valueType !== 'JsonValue'} />
        </Space.Compact>
    </Form.Item>
}



/**
 * 单选取值：获取选中的值
 * @param constants 盛放选中的Constant结果
 * @param multiple 是否多选
 * @param arry 所选的id数组 从枚举或集合类型中选[1, 0], [1, "甲"]以及 [4]；
 * @param paramType 常量类型，用于填充到jsonValue中的_class
 * @param constantKey 从哪个缓存中搜索Constant
 * @returns 
 */
const getJsonValueFromArray = (constants: Constant[], multiple: boolean, arry: (string | number)[], paramType?: ParamType, constantKey?: string) => {
    //console.log("getJsonValueFromArray: arry=" + JSON.stringify(arry))
    const constantId = arry[0]
    const constant: Constant | undefined = Cache.findOne(constantKey || "", constantId, "id")
    if (constant) {
        let jsonValue: JsonValue | undefined
        
        if (arry.length > 1) {//常量是集合或枚举类型，其中的值被选中一个
            if (constant.isEnum) {
                //arry[1]可能是LabelValue的value
                jsonValue = { value: arry[1], _class: paramType?.code || constant.jsonValue?._class || "String" }
            } else {
                //arry[1]是各种基本类型
                jsonValue = { value: arry[1], _class: paramType?.code || constant.jsonValue?._class || "String" }
            }
        } else {
            //多选：常量集合或枚举中的类型全部选中 单选：常量的值只是简单的基本类型
            jsonValue = constant.value? JSON.parse(constant.value) : undefined//有可能为空
        }
        
        if(!jsonValue){
            console.warn("getJsonValueFromArray: no jsonValue in constant: ", constant)
             return undefined
        }

        if (multiple) {//多选
            jsonValue._class = jsonValue._class.replaceAll("Set", "").replaceAll("Enum", "") + "Set"
        } else {//单选：[1, "乙"] 以及 [4]；
            jsonValue._class = jsonValue._class.replaceAll("Set", "").replaceAll("Enum", "")
        }
        constants.push(constant)
        
        return jsonValue
    } else {
        console.warn("Should not come here, no Constant, id=" + constantId + ", cacheKey="+constantKey)
    }
    return undefined
}

/**
 * 多选选中多个取值
 * @param constants 盛放选中的Constant结果
 * @param multiple 是否多选
 * @param arrayArray 多选选中多个[[3],[1, 2],[1, 2],[1, 2]]，[[1, '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
 * @param paramType 常量类型，用于填充到jsonValue中的_class
 * @param constantKey 从哪个缓存中搜索Constant
 * @returns 
 */
const getJsonValueFromArrayArray = (constants: Constant[], multiple: boolean, arrayArray: (string | number)[][], paramType?: ParamType, constantKey?: string) => {
    //console.log("getJsonValueFromArrayArray: arrayArray=" + JSON.stringify(arrayArray))
    const value = arrayArray.flatMap((e) => getJsonValueFromArray(constants, multiple, e, paramType, constantKey)?.value)
    .filter((e) => e !== undefined) as ( (string| number)[] | LabelValue[]) //因为e有可能是单个元素也有可能是数组，故使用flatMap 而不是map

    if(value.length === 0){
        console.log("not get jsonValue in arrayArray: ", arrayArray)
         return undefined
    }

    let _class =  paramType?.code || (constants.length > 0? (constants[0]?.jsonValue?._class || "String"): "String")
    if (multiple) {//多选
        _class = _class.replaceAll("Set", "").replaceAll("Enum", "") + "Set"
    } else {//单选：[1, "乙"] 以及 [4]；
       _class =_class.replaceAll("Set", "").replaceAll("Enum", "")
    }

    const jsonValue: JsonValue = { _class, value }

    //console.log("get jsonValue in arrayArray: ",jsonValue)

    return jsonValue
}

