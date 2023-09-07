import { Cache } from '@rwsbillyang/usecache'
import { AllParamTypeKey, BasicExpression, BasicExpressionMeta, BasicExpressionRecord, ComplexExpression, ComplexExpressionMeta, ComplexExpressionRecord, OpValue, ParamType, ValueMeta } from "./DataType"


/**
 * 为变量设置值域时，不仅仅基本类型可以有值域，Set集合类型也可以有对应的基本类型的值域
 * 
 * @returns 获取基本类型的id，只有Set集合类型才更换成基本类似的typeId，依赖于缓存AllParamTypeKey对应的数据
 */
export const getBasicTypeId = (parmTypeId?: number) => {
    if (parmTypeId === undefined) return parmTypeId
    let basicTypeId = parmTypeId

    const paramType: ParamType = Cache.findOne(AllParamTypeKey, parmTypeId, "id")
    if (paramType) {
        const end = paramType.code.indexOf("Set")
        //console.log("end="+end)
        if (end && end > 0) {
            const basicTypeCode = paramType.code.slice(0, end)
            const basicType = Cache.findOne(AllParamTypeKey, basicTypeCode, "code")
            if (basicType) {
                basicTypeId = basicType.id
                //console.log("basicTypeId=" + basicTypeId + ", basicType.code="+basicType.code)
            }
        }

    }
    return basicTypeId
}

/**
 * 根据类型的code，查询得到其id
 * @param parmTypeCode 
 * @returns 
 */
export const typeCode2Id = (parmTypeCode: string) => {
    const paramType: ParamType = Cache.findOne(AllParamTypeKey, parmTypeCode, "code")
    return paramType?.id
}


export const basicExprRecord2String = (expr?: BasicExpressionRecord)=>{
    if(!expr) return "暂无"
    return "[" + expr.label + "]: " + basicExpressionMeta2String(expr.meta)
}
export const complexExprRecord2String = (expr?: ComplexExpressionRecord)=>{
    if(!expr) return "暂无"
    return "[" + expr.label + "]: " + complexExpressionMeta2String(expr.meta)
}

/**
 * 将BasicExpressionMeta转换为human-reading字符串
 * @param meta BasicExpressionMeta
 * @returns 
 */
export const basicExpressionMeta2String = (meta?: BasicExpressionMeta)=>{
    if(!meta || meta._class === "Complex") return "暂无"
    const oprand = [meta.other, meta.start, meta.end, meta.set, meta.e, meta.num]
    .filter(e=>!!e)
    .map((e)=> valueMeta2String(e))
    .join(", ")

    return meta.param?.label + " " + meta.op?.label + oprand
}



/**
 * 将ComplexExpressionMeta转换为human-reading字符串
 * @param meta ComplexExpressionMeta
 * @returns 
 */
export const complexExpressionMeta2String = (meta?: ComplexExpressionMeta)=>{
    if(!meta || meta._class !== "Complex") return "暂无"
    const list = meta.metaList?.map((e)=>{
        if(e._class === "Complex"){
            return complexExpressionMeta2String(e as ComplexExpressionMeta)
        }else{
            return basicExpressionMeta2String(e)
        }
    }).join(", ")

    return  meta.op?.code + "("+ list +")"
}

/**
 * 将ValueMeta转换为human-reading字符串
 * @param valueMeta 
 * @returns 
 */
export const valueMeta2String = (valueMeta?: ValueMeta) => {
    if(!valueMeta) return ""
    if(valueMeta.valueType  === 'Param'){
        return "变量"+ valueMeta.param?.label + "("+ valueMeta.param?.mapKey+")"
    }else if(valueMeta.valueType  === 'Constant'){
        return "常量" + "("+ valueMeta.jsonValue?.value+")"       
    }else if(valueMeta.valueType  === 'JsonValue'){
        return "值" + "("+ valueMeta.jsonValue?.value+")"    
    }else{
        console.warn("should not come here, wrong valueMeta.valueType =" + valueMeta.valueType )
        return "wrong valueMeta.valueType!!!"
    }
}



/**
 * 将BasicExpressionMeta转换为对应的表达式
 * @param meta BasicExpressionMeta
 * @returns 
 */
export const basicMeta2Expr = (meta?: BasicExpressionMeta) => {
    if (!meta) return undefined
    if (!meta.param || !meta.op) {
        console.log("should not come here: no param or op")
        return undefined
    }
    const expr: BasicExpression = {
        _class: meta.param.paramType.code,
        key: meta.param.mapKey,
        op: meta.op.code,
        other: valueMeta2OpValue(meta.other),
        start: valueMeta2OpValue(meta.start),
        end: valueMeta2OpValue(meta.end),
        set: valueMeta2OpValue(meta.set),
        e: valueMeta2OpValue(meta.e),
        num: valueMeta2OpValue(meta.num)
    }
    return expr
}

/**
 * 将ComplexExpressionMeta转换为对应的表达式
 * @param meta ComplexExpressionMeta
 * @returns 
 */
export const complexMeta2Expr =  (meta?: ComplexExpressionMeta) => {
    if (!meta) return undefined
    if (!meta.op) {
        console.log("should not come here: no op")
        return undefined
    }  
    const list = meta.metaList.map((e)=>{
        if(e._class === "Complex"){
            return complexMeta2Expr(e as ComplexExpressionMeta)
        }else{
            return basicMeta2Expr(e)
        }
    }).filter((e) => !!e)


    const expr: ComplexExpression = {
        _class: meta._class,
        op: meta.op.code,
        exprs: list as (BasicExpression|ComplexExpression)[]
    }
    return expr
}

export function meta2Expr(meta?: BasicExpressionMeta | ComplexExpressionMeta ){
    if(!meta) return undefined
    if(meta._class === "Complex")
        return complexMeta2Expr(meta as ComplexExpressionMeta)
    else return basicMeta2Expr(meta)
}


/**
 * 将ValueMeta转换为纯表达式中的必要字段值
 * @param valueMeta ValueMeta
 * @returns 
 */
const valueMeta2OpValue = (valueMeta?: ValueMeta) => {
    if (!valueMeta) return undefined
    return {
        valueType: valueMeta.valueType,
        key: valueMeta.param?.mapKey,
        value: valueMeta.jsonValue?.value
    }
}


/***
 * 有效信息，用于生成md5作为id
 */
export const opValue2Md5Msg = (name:string, opValue?: OpValue)=>{
    if(!opValue) return ""
    if(opValue.valueType === "Param") return `&${name}.OpValueKey=${opValue.key}`
    else return `&${name}.OpValueValue=${opValue.value}`
}







/**
 * 将对象以 {key1=v1&key2=v2} 形式连接起来，key经过排序，若遇到子对象将深度遍历
 * 这样，相同值的对象将得到相同的字符串
 * @param obj 
 * @returns 
 */
export function sortedConcat(obj: any) {
    const keys = Object.keys(obj).sort()

    let str = "{"
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        const v = obj[key]
        if(v){
            str += `${key}=$`
            if(typeof v === 'object'){
                str += `${key}=${sortedConcat(v)}&`
            }else{
                str += `${key}=${v}&`
            } 
        }
    }

    const key = keys[keys.length - 1]
    const v = obj[key]
    if(v){
        str += `${key}=$`
        if(typeof v === 'object'){
            str += `${key}=${sortedConcat(v)}&`
        }else{
            str += `${key}=${v}`
        } 
    }

    return str + "}";
}


