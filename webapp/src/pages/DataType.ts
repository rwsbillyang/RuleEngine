import { BasePageQuery, BaseRecord, SqlRecord } from "@rwsbillyang/usecache"
import { LabeledValue } from "antd/es/select"


export interface LabeldBean extends SqlRecord {
    label: string //label名称
}

export const AllDomainKey = "domainAll"
export interface Domain extends LabeldBean { }
export interface DomainQueryParams extends BasePageQuery {
    label?: string
}



/**
 * 操作符, 如>,>=, <, <=, !=, ==, in, between
 * @param op 操作符
 * @param types 适用变量类型
 */
export interface Operator extends LabeldBean {
    code: string,
    isSys: boolean
    remark?: string
}
export interface OperatorQueryParams extends BasePageQuery {
    label?: string
    isSys?: boolean
    ids?: string //,分隔的id ， 即根据operator.id列表查询
}



export const AllParamTypeKey = "paramAll"
/**
 * 类型，如数值、字符串、日期、布尔, 数组，集合等
 * @param value 参数变量类型
 */
export interface ParamType extends LabeldBean {
    code: string,
    supportOpIds: string,
    supportOps?: Operator[], //,分隔的operator id
    isSys: boolean,
    isBasic: boolean//基本类型
}
export interface ParamTypeQueryParams extends BasePageQuery {
    label?: string
    isSys?: boolean
    isBasic?: boolean
    typeId?: number
}



export interface JsonValue {
    _class: string, //backend ktorkit lib set: classDiscriminator="_class"
    value?: boolean | string | number | (string | number)[]
}
/**
 * 值常量
 * @param value 常量值
 * @param type 参数变量类型
 */
export interface Constant extends LabeldBean {
    isEnum: boolean,//是否是枚举
    remark?: string//备注

    jsonValue?: JsonValue, //提交时根据typeInfo生成此字段，提交给后端
    value?: string //后端保存jsonValue的字段数据

    domain?: Domain//来自后端，用于展示列表项
    domainId?: number//select选择时设置，提交给后端

    paramType?: ParamType //来自后端，用于展示列表项
    typeId?: number//提交时根据typeInfo生成此字段，提交给后端
    typeInfo?: LabeledValue //虚构字段，用于保存一些选中的type信息，其中type的code字段用于配置jsonValue的_class信息 设置fieldProps:{labelInValue: true},后临时保存的选中的变量 
}
export interface ConstantQueryParams extends BasePageQuery {
    label?: string
    isEnum?: boolean
    domainId?: number
    typeIds?: string //类型id, ","分隔
    ids?: string//id, ","分隔
}




/**
 * 参数变量
 * @param key engine用于从map中取值
 * @param type 参数变量类型
 */
export interface Param extends LabeldBean {
    mapKey: string,

    remark?: string, //备注

    domain?: Domain
    domainId?: number

    paramType: ParamType,
    typeId: number,


    valueScopeIds?: string, //值范围来自哪些常量的id
    valueScopes?: Constant[],
    constantIds?: number[] //临时保存的值
}
export interface ParamQueryParams extends BasePageQuery {
    label?: string
    typeId?: number
    mapKey?: string
    domainId?: number
}



export interface ExpressionQueryParams extends BasePageQuery {
    label?: string
    domainId?: number
    type?: 'Basic' | 'Complex'
}
/**
 * 表达式，构成规则的条件
 * @param key 用于从map中取值
 * @param op 操作符
 * @param value 值
 * @param valueType 参数变量类型
 */
export interface Expression extends LabeldBean {
    type: 'Basic' | 'Complex'
    remark?: string//备注

    domain?: Domain
    domainId?: number

    exprStr?: string,//json of Expression
    metaStr?: string,//json of ExpressionMeta
}
export interface BasicExpressionRecord extends Expression {
    expr?: BasicExpression
    meta?: BasicExpressionMeta//json of ExpressionMeta
}
export interface ComplexExpressionRecord extends Expression {
    expr?: ComplexExpression
    meta?: ComplexExpressionMeta
}


export interface BasicExpressionMeta {
    _class: string, //'Bool' | 'Int' | 'Double' | 'Long' | 'String' ....
    //domainId?: number,

    paramId?: number,
    param?: Param,

    opId?: number,
    op?: Operator,

    other?: ValueMeta
    start?: ValueMeta//key所在变量范围比较
    end?: ValueMeta//key所在变量范围比较
    set?: ValueMeta//key所在变量是否存在于set中
    e?: ValueMeta //key所在变量集中是否包含e
    num?: ValueMeta //key所在变量集与other交集元素个事 与num比较
    //valueMap: Map<'other'| 'start' | 'end' | 'set' | 'e' | 'num', ValueMeta>  //  [key: string]: Constant
}

export const basicExpressionMeta2String = (meta?: BasicExpressionMeta)=>{
    if(!meta) return "暂无"
    const oprand = [meta.other, meta.start, meta.end, meta.set, meta.e, meta.num]
    .filter(e=>!!e)
    .map((e)=> valueMeta2String(e))
    .join(", ")

    return meta.param?.label + " " + meta.op?.label +": " + oprand
}

export interface ComplexExpressionMeta {
    _class: "Complex",
    op: Operator,
    metaList: BasicExpressionMeta[]
}

//若constantId、constant存在则使用constant值，否则使用value
/**
 * @param type 分别来自哪一种类型
 * @param paramId 来自变量
 * @param param 来自变量
 * @param constantId 来自常量 该值来自Select选中的value，因为value既可能是id，也可能是值，抑或其它，故此数组中的值代表着什么意义未定
 * @param constant 来自常量
 * @param jsonValue 手工输入的值
 */
export interface ValueMeta {
    valueType?: "Param" | "Constant" | "JsonValue" | undefined
    paramId?: number
    param?: Param
    constantIds?: (string | number)[] | (string | number)[][] //eg.树形select的option的value 树形单选：[1, "乙"] 以及 [4]；多选选中多个[[1, '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
    constantIdsStr?: string //由于constantIds类型，对于后端序列化反序列化支持不好，转换成str进行保存
    //constants?: Constant[]
    jsonValue?: JsonValue
}
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

export interface OpValue {
    valueType?: "Param" | "Constant" | "JsonValue" | undefined
    key?: string // for Param type
    value?: boolean | string | number | (string | number)[]
}
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


export interface Expr {
    _class: string, //后端需要做序列化
    op: string //Operator.code
}

export interface BasicExpression extends Expr {
    key: string//值为: BasicExpressionMeta.param.mapKey
    
    other?: OpValue
    start?: OpValue//key所在变量范围比较
    end?: OpValue//key所在变量范围比较
    set?: OpValue//key所在变量是否存在于set中
    e?: OpValue //key所在变量集中是否包含e
    num?: OpValue //key所在变量集与other交集元素个事 与num比较
}
export interface ComplexExpression extends Expr {
    //op: string
    exprs: (BasicExpression|ComplexExpression)[]
}



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


 
export interface RuleQueryParams extends BasePageQuery{
    label?: string,
    domainId?: number,
    enable?: boolean,
    tags?: string,
    threshhold?: number
}


export interface Rule extends BaseRecord {
    id: string, //md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)

    label?: string,
    priority?: number,
    remark?: string,
    enable: boolean // default true,
    
    tags?: string,
    tagList?: string[] // only for front end

    threshhold?: number, //percent

    exprId?: number,//if exprId not null, use it 如果exprId非空，则exprStr和metaStr来自Expression记录；否则由前端编辑时提供
    exprStr?: string,//json string of LogicalExpr
    metaStr?: string,//json string of ExpressionMeta

    thenAction?: string,// if do
    elseAction?: string, //else do

    domainId?: number,
    domain?: Domain, //前端列表数据需要

    expr? : BasicExpression | ComplexExpression,//由exprStr解析或前端提供 only for front end
    meta?: BasicExpressionMeta | ComplexExpressionMeta//由metaStr解析或前端提供 only for front end


    ruleChildrenIds?: string, // json string of Rule.id List, insert/save one when create a child in front end
    ruleChildren?: Rule[],

    ruleGroupChildrenIds?: string,// json string of RuleGroup.id List, insert one when create a child in front end
    ruleGroupChildren?: RuleGroup[]
}


export interface RuleGroupQueryParams extends BasePageQuery{
    label?: string,
    domainId?: number,
    enable?: boolean
}
export interface RuleGroup extends BaseRecord {
    id: string, //md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)

    label: string,
    exclusive: boolean // default true,

    enable: boolean // default true,
    
    tags?: string,
    tagList?: string[] // only for front end

    remark?: string,
    priority?: number,

    domainId?: number,
    domain?: Domain,

    ruleChildrenIds?: string, // json string of Rule.id List, insert/save one when create a child in front end
    ruleChildren?: Rule[],

    ruleGroupChildrenIds?: string,// json string of RuleGroup.id List, insert one when create a child in front end
    ruleGroupChildren?: RuleGroup[]
}

export interface RuleActionQueryParams extends BasePageQuery{
    actionKey?: string,
}
export interface RuleAction extends LabeldBean{
    actionKey: string,
    remark?: string
}