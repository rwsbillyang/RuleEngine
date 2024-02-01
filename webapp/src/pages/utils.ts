import { Cache } from '@rwsbillyang/usecache'
import { AllParamTypeKey, BasicExpression, BasicExpressionMeta, BasicExpressionRecord, ComplexExpression, ComplexExpressionMeta, ComplexExpressionRecord, BaseExpressionRecord, JsonValue, OperandConfig, OperandConfigItem, ParamType, OperandMeta, OperandMiniMeta, LabelValue } from "./DataType"


/**
 * 为变量设置值域时，不仅仅基本类型可以有值域，Set集合类型也可以有对应的基本类型的值域
 * 
 * @returns 获取基本类型，只有Set集合类型才更换成基本类似的typeId，依赖于缓存AllParamTypeKey对应的数据
 */
export const getBasicType = (parmTypeId?: number, cacheKey: string = AllParamTypeKey) => {
    if (parmTypeId === undefined) return undefined

    let paramType: ParamType | undefined = Cache.findOne(cacheKey, parmTypeId, "id")
    if (paramType) {
        let end = paramType.code.indexOf("Set")
        if (end < 0) end = paramType.code.indexOf("Enum")
        //console.log("end="+end)
        if (end > 0) {
            const basicTypeCode = paramType.code.slice(0, end)
            paramType = Cache.findOne(cacheKey, basicTypeCode, "code")
        } 
    }
    return paramType
}
// export const getBasicTypeId = (parmTypeId?: number) => {
//     if (parmTypeId === undefined) return parmTypeId
//     let basicTypeId = parmTypeId

//     const paramType: ParamType = Cache.findOne(AllParamTypeKey, parmTypeId, "id")
//     if (paramType) {
//         let end = paramType.code.indexOf("Set")
//         if(end < 0) end = paramType.code.indexOf("Enum")
//         //console.log("end="+end)
//         if (end > 0) {
//             const basicTypeCode = paramType.code.slice(0, end)
//             const basicType = Cache.findOne(AllParamTypeKey, basicTypeCode, "code")
//             if (basicType) {
//                 basicTypeId = basicType.id
//                 //console.log("basicTypeId=" + basicTypeId + ", basicType.code="+basicType.code)
//             }
//         }

//     }
//     return basicTypeId
// }

/**
 * 获取基本类型和容器类型的ids字符串
 * @param typeId 
 * @returns 
 */
export const type2Both = (typeId?: number, cacheKey: string = AllParamTypeKey) => {
    if (typeId) {
        const basicType = getBasicType(typeId)
        if (basicType) {
            const setTypeId = typeCode2Id(basicType.code + "Set", cacheKey)
            const typeIds = [basicType.id, setTypeId].filter(e => e !== undefined)
            return typeIds.join(",")
        } else {
            return undefined
        }

    } else
        return undefined
}

/**
 * 根据类型的code，查询得到其id
 * @param parmTypeCode 
 * @returns 
 */
export const typeCode2Id = (parmTypeCode: string, cacheKey: string = AllParamTypeKey) => {
    const paramType: ParamType | undefined = Cache.findOne(cacheKey, parmTypeCode, "code")
    return paramType?.id
}



/**
 * 操作数配置字符串转换成OperandConfigItem[] 和 object
 * @param mapStr 
 * @returns 
 */
export const operandConfigMapStr2List = (mapStr?: string) => {
    if (!mapStr) return undefined

    //const map: Map<string, OperandConfig> = new Map<string, OperandConfig>()
    const cfgObj: { [k: string]: OperandConfig } = {}
    const list: OperandConfigItem[] = []

    const obj = JSON.parse(mapStr)
    Object.keys(obj).forEach((e) => {
        const cfg = obj[e]
        //map.set(e, cfg as OperandConfig)
        cfgObj[e] = cfg as OperandConfig
        list.push({ ...cfg, name: e })
    })

    return { obj: cfgObj, list }
}
//obj: Map<string, OperandConfig>
/**
 * 操作数配置转换成列表
 * @param obj 
 * @returns 
 */
export const operandConfigObj2List = (obj: { [k: string]: OperandConfig }) => {
    const list: OperandConfigItem[] = []
    for (let k in obj) {
        list.push({ ...obj[k], name: k }) //map.forEach((v, k) => list.push({ ...v, name: k }))
    }
    return list
}

export const exprRecord2String = (expr: BaseExpressionRecord) => expr.type === "Complex" ?
    complexExpressionMeta2String((expr as ComplexExpressionRecord).meta)
    : basicExpressionMeta2String((expr as BasicExpressionRecord).meta)


export const basicExprRecord2String = (expr?: BasicExpressionRecord) => {
    if (!expr) return "暂无"
    return "[" + expr.label + "]: " + basicExpressionMeta2String(expr.meta)
}
export const complexExprRecord2String = (expr?: ComplexExpressionRecord) => {
    if (!expr) return "暂无"
    return "[" + expr.label + "]: " + complexExpressionMeta2String(expr.meta)
}

/**
 * 将BasicExpressionMeta转换为human-reading字符串
 * @param meta BasicExpressionMeta
 * @returns 
 */
export const basicExpressionMeta2String = (meta?: BasicExpressionMeta) => {
    if (!meta || meta._class === "Complex") return "暂无"

    const list: { key: string, value: OperandMeta | undefined }[] = []
    for (let k in meta.operandMetaObj) {
        list.push({ key: k, value: meta.operandMetaObj[k] })   //meta.operandValueMap.forEach((v,k)=>{ list.push({key: k, value: v}) })
    }

    const oprand = list.map((e) => operandMeta2String(e.key, e.value)).filter(e => e !== "").join(", ")

    const keyExtra = meta.extra ? meta.extra : ''
    if (meta.mapKey)
        return `${meta.mapKey}'${meta.op?.label}': ${oprand} ${keyExtra}`
     else if (meta.param)
        return `${meta.param.label}'${meta.op?.label}': ${oprand} ${keyExtra}`
    else
        return `unknown'${meta.op?.label}': ${oprand} ${keyExtra}`
}



/**
 * 将ComplexExpressionMeta转换为human-reading字符串
 * @param meta ComplexExpressionMeta
 * @returns 
 */
export const complexExpressionMeta2String = (meta?: ComplexExpressionMeta) => {
    if (!meta || meta._class !== "Complex") return "暂无"
    const list = meta.metaList?.map((e) => {
        if (e._class === "Complex") {
            return complexExpressionMeta2String(e as ComplexExpressionMeta)
        } else {
            return basicExpressionMeta2String(e as BasicExpressionMeta)
        }
    }).join("; ")

    return meta.op?.code + "(" + list + ")"
}

/**
 * 将OperandValueMeta转换为human-reading字符串
 * @param operandMeta 
 * @returns 
 */
export const operandMeta2String = (name: string, operandMeta?: OperandMeta) => {
    if (!operandMeta) return ""
    if (operandMeta.t === 'P') {
        return name + "=" + operandMeta.param?.label + "(" + operandMeta.param?.mapKey + ")"
    } else if (operandMeta.t === 'C' || operandMeta.t === 'J') {
        const v = jsonValue2String(operandMeta.jsonValue)
        return v !== undefined ? name + "=" + v : ""
    } else {
        console.warn("should not come here, wrong operandMeta.valueType =" + operandMeta.t)
        return "wrong operandMeta.valueType!!!"
    }
}

//to human-reading string
const jsonValue2String = (jsonValue?: JsonValue) => {
    if (!jsonValue || jsonValue.v === undefined) return undefined
    const value = jsonValue.v
    if (Array.isArray(value)) {
        if(value.length === 0) return "[]"
        if(typeof value[0]  === 'object'){
            return "[" + value.map((e)=> e.label || e.value).join(",") + "]"
        }else{
            return "[" + value.join(",") + "]"
        }  
    } else{
        if(typeof value  === 'object'){
            const v = value as LabelValue
            return v.label || v.value
        }else
            return value
    }     
}

/**
 * 将BasicExpressionMeta转换为对应的表达式
 * @param meta BasicExpressionMeta
 * @returns 
 */
export const basicMeta2Expr = (meta?: BasicExpressionMeta, toMini: boolean = true) => {
    if (!meta) return undefined
    if (!meta.op) {
        console.log("should not come here: no op")
        return undefined
    }
    const operandValueObj: { [key: string]: OperandMiniMeta | JsonValue } = {}
    for (let k in meta.operandMetaObj) {
        const v = operandMeta2Operand(k, meta.operandMetaObj[k], toMini)
        //if(v === -1) return -1
        if (v !== undefined) operandValueObj[k] = v
    }

    const expr: BasicExpression = {
        _class: meta.type || meta.op?.type,
        key: "",
        op: meta.op.code,
        operands: operandValueObj
    }

    if (meta.mapKey) {
        expr.key = meta.mapKey
        expr.extra = meta.extra
        return expr
    }else if (meta.param) {
        expr.key = meta.param.mapKey
        expr.extra = meta.param.extra
        return expr
    }

    if(!expr._class)
    {
        console.warn("no expr._class, in meta.type || meta.op?.type") 
    }

    console.warn("should not come here: please check meta.type or meta.mapKey")
    return undefined
}

//数据量过大，尤其某些复合表达式数据量超过字段存储空间
export const removeBasicExpressionMetaFields = (meta: BasicExpressionMeta, keepOperandCfgStr: boolean = false) => {
    if(meta.param){
        delete  meta.param
        // delete meta.param.domain
        // delete meta.param.domainId
        // delete meta.param.remark
        // delete meta.param.paramCategory

        // delete meta.param.paramType.domain
        // delete meta.param.paramType.domainId
        // delete meta.param.paramType.supportOps
    }
    if(meta.paramType){
        delete meta.paramType
        // delete meta.paramType.domain
        // delete meta.paramType.domainId
        // delete meta.paramType.supportOps
    } 
    if(meta.op){
        //delete meta.op
        delete meta.op.domain
        delete meta.op.remark
        delete meta.op.operandConfigList
        if(!keepOperandCfgStr) delete meta.op.operandConfigMapStr
    }
}
//数据量过大，尤其某些复合表达式数据量超过字段存储空间
export const removeComplexExpressionMetaFields = (meta: ComplexExpressionMeta) => {
    meta.metaList.forEach((e) => {
        if (e._class === "Complex") {
            removeComplexExpressionMetaFields(e as ComplexExpressionMeta)
        } else {
            removeBasicExpressionMetaFields(e as BasicExpressionMeta)
        }
    })
}

/**
 * jsonValue.raw是LabelValue构成，则去掉其label
 */
const extractIfLabelValue = (jsonValue?: JsonValue) => {
    if (jsonValue && jsonValue.v){
        const raw = jsonValue.v
        if (Array.isArray(raw)) {
            if(raw.length > 0 && typeof raw[0]  === 'object'){
                jsonValue.v = (raw as LabelValue[]).map((e)=> e.value)
            }
        } else{
            if(typeof raw  === 'object'){
                jsonValue.v =  (raw as LabelValue).value
            }
        }   
    }   
}
/**
 * 将OperandValueMeta转换为纯表达式中的必要字段值
 * @param operandMeta OperandValueMeta
 * @returns 
 */
const operandMeta2Operand = (name: string, operandMeta?: OperandMeta, toMini: boolean = true) => {
    if (operandMeta === undefined) return undefined
   
    if(operandMeta.t === 'P'){
        if(!operandMeta.param || !operandMeta.param.mapKey){
            console.warn("operandMeta.valueType is'Param', but no param or param.mapKey")
            return undefined
        }else{
            const key = operandMeta.param.mapKey
            if(toMini){
                const opvalue: JsonValue = {
                    _class: "Var",//服务器端  IType.Type_Variable = "Var"
                    v: key,
                }
                return opvalue
            }else{
                const opvalue: OperandMiniMeta = {
                    t: operandMeta.t,
                    key: key,
                }
                return opvalue
            }
        }
    }

    const jsonValue = operandMeta.jsonValue
    if(!jsonValue) return undefined


    //老字段value改成raw，在改成v，删除老字段
    // if(jsonValue.raw === undefined || jsonValue.raw === "") return undefined
    // jsonValue.v = jsonValue.raw
    // delete jsonValue.raw  

    if(jsonValue.v === undefined || jsonValue.v === "") return undefined

      
    if(!checkJsonValueClass(jsonValue._class)){
        console.warn("wrong jsonValue class:" + jsonValue._class + ", name="+name)
        //纠正历史数据中的一些错 
        // if(name === "starSet") jsonValue._class = "StringSet"
        // if(name === "gongSet") jsonValue._class = "StringSet"
        // if(name === "zhiSet") jsonValue._class = "IntSet"
        // if(name === "num"){
        //     jsonValue._class ="Int"
        //     jsonValue.v = +jsonValue.v
        // }
    }
    
    if((jsonValue._class === "Int" || jsonValue._class === "Long" || jsonValue._class === "Double") 
    && typeof jsonValue.v !== 'number' ){
        console.warn("wrong jsonValue.v, not number: " + jsonValue.v  + ", name="+name)
        jsonValue.v = +jsonValue.v 
    }
    
    extractIfLabelValue(operandMeta.jsonValue)

    if(toMini){
        return jsonValue
    }else{
        const opvalue: OperandMiniMeta = {
            t: operandMeta.t,
            value:  jsonValue
        }
        return opvalue
    }
}

/**
 * 将ComplexExpressionMeta转换为对应的表达式
 * @param meta ComplexExpressionMeta
 * @returns 
 */
export const complexMeta2Expr = (meta?: ComplexExpressionMeta) => {
    if (!meta) return undefined
    if (!meta.op) {
        console.log("should not come here: no op")
        return undefined
    }
    const list = meta.metaList.map((e) => {
        if (e._class === "Complex") {
            return complexMeta2Expr(e as ComplexExpressionMeta)
        } else {
            return basicMeta2Expr(e as BasicExpressionMeta)
        }
    }).filter((e) => !!e)


    const expr: ComplexExpression = {
        _class: meta._class,
        op: meta.op.code,
        exprs: list as (BasicExpression | ComplexExpression)[]
    }
    return expr
}

export function meta2Expr(meta?: BasicExpressionMeta | ComplexExpressionMeta) {
    if (!meta) return undefined
    if (meta._class === "Complex")
        return complexMeta2Expr(meta as ComplexExpressionMeta)
    else
        return basicMeta2Expr(meta as BasicExpressionMeta)
}

export const checkJsonValueClass = (code: string) => {
    const codes = ["Bool", "Int", "Double", "Long", "String","DateTime", 
    "IntSet", "DoubleSet", "LongSet", "StringSet","DateTimeSet",
    "IntEnum", "DoubleEnum", "LongEnum", "StringEnum","DateTimeEnum"]
    
    for(let i = 0; i< codes.length; i++){
        if(code === codes[i])
            return true
    }
    return false
}

export const getJsonValueClassIfMultiple = (code: string) =>{
    const codes = ["Bool", "Int", "Double", "Long", "String", "DateTime"]
    for(let i = 0; i< codes.length; i++){
        if(code === codes[i])
            return code + "Set"
    }
    return code
}

/***
 * 有效信息，用于生成md5作为id
 */
export const opValue2Md5Msg = (name: string, opValue?: OperandMiniMeta) => {
    if (opValue === undefined) return ""
    if (opValue.t === "P") return `&${name}.OperandKey=${opValue.key}`
    else return `&${name}.OperandValue=${opValue.value}`
}







/**
 * 将对象以 {key1=v1&key2=v2} 形式连接起来，key经过排序，若遇到子对象将深度遍历
 * 这样，相同值的对象将得到相同的字符串
 * @param obj 
 * @returns 
 */
export function sortedConcat(obj?: any) {
    if(!obj) return "{}"
    const keys = Object.keys(obj).sort()

    let str = "{"
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        const v = obj[key]
        if (v) {
            str += `${key}=$`
            if (typeof v === 'object') {
                str += `${key}=${sortedConcat(v)}&`
            } else {
                str += `${key}=${v}&`
            }
        }
    }

    const key = keys[keys.length - 1]
    const v = obj[key]
    if (v) {
        str += `${key}=$`
        if (typeof v === 'object') {
            str += `${key}=${sortedConcat(v)}&`
        } else {
            str += `${key}=${v}`
        }
    }

    return str + "}";
}
