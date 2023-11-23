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
 * 一个逻辑表达式构成因素：表达式类型（变量类型决定）、变量（mapKey或记录库中添加的变量记录）、操作码、若干操作数构成
 * 不同的操作码会有不同的操作数，OperandConfig正是操作数的配置
 * 系统内置操作码预先生成，不可修改
 *
 *
 * @param label 创建表达式或规则时，输入时操作数时的提示标签
 * @param tooltip 创建表达式或规则时，输入时操作数时的提示帮助提示
 * @param required 操作数是否必须填写
 * @param multiple 用于创建表达式或规则时，选择输入框过滤常量是否多选 当typeCode是基本类型时，操作数也可能是其对应的容器类型，
 * @param typeCode 操作数数据类型，null表示与变量类型一致；用于创建表达式或规则时，选择输入框过滤常量或变量
 * @param contantIds 操作数值域，用于创建表达式或规则时，选择输入框过滤常量 UI中创建自定义操作码时需要指定
 * @param selectOptions 操作数值域，不是从远程加载常量，而是指定的选择范围内选
 * @param defaultSelect 操作数值域select默认值
 * @param defaultOperandValueType 前端OperandValueMeta.valueType: "Param" | "Constant" | "JsonValue"
 * @param enable 一般总是激活状态
 *
 * */
export interface OperandConfig{
    label: string,
    tooltip?: string,
    required: boolean,
    multiple: boolean,
    typeCode?: string,//操作数数据类型 null表示与变量类型一致
    contantIds?: number[], //操作数值域 常量id数组[1,2,3]
    selectOptions?: LabelValue[]
    defaultSelect?: string
    defaultOperandValueType?:  "Param" | "Constant" | "JsonValue" 
    enable: boolean
}
/**
 * 当OperandConfigItem的name，或者Opcode中的operandConfigMap的某一项键值为v0时，表示变量本身的配置
 * 后端定义的OpEnum中的配置map中拖添加了v0键，或者前端操作符的配置中，若添加了v0键，则表示变量本身的配置
 */
export const ParamOperandConfigKey = "v0"
/**
 * 用于将operandConfigMap转换为列表项，name即map中键key，在form中需要该列表
 */
export interface OperandConfigItem extends OperandConfig{
    name: string
}
/**
 * 操作符, 如>,>=, <, <=, !=, ==, in, between
 * @param op 操作符
 * @param types 适用变量类型
 */
export interface Opcode extends LabeldBean {
    id: number,
    code: string,
    isSys: boolean,
    remark?: string,
    type: 'Basic'| "Collection" | 'Logical' | 'Ext' | 'Customize',
   
    domain?: Domain//来自后端，用于展示列表项
    domainId?: number//select选择时设置，提交给后端


    operandConfigMapStr?: string //数据库中实际存储的配置信息 : {[k:string]: OperandConfig} 

   
    //临时字段 由转换operandValueMapStr而来
    operandConfigList?: OperandConfigItem[]
}
export interface OpcodeQueryParams extends BasePageQuery {
    label?: string
    isSys?: boolean
    type?: 'Basic'| "Collection" | 'Logical' | 'Customize'// OpType
    ids?: string //,分隔的id ， 即根据Opcode.id列表查询
    domainId?: number
}

    


export const AllParamTypeKey = "paramTypeAll"
/**
 * 类型，如数值、字符串、日期、布尔, 数组，集合等
 * @param value 参数变量类型
 */
export interface ParamType extends LabeldBean {
    code: string,
    supportOpIds: string,
    supportOps?: Opcode[], //,分隔的Opcode id
    isSys: boolean,
    type: 'Basic'| "Collection" | 'Ext' | 'Customize',

    domain?: Domain//来自后端，用于展示列表项
    domainId?: number//select选择时设置，提交给后端
}
export interface ParamTypeQueryParams extends BasePageQuery {
    label?: string
    isSys?: boolean
    type?: 'Basic'| "Collection" | 'Ext' | 'Customize'
    typeId?: number
    domainId?: number
}

//常量中有标签的枚举类型，如整形枚举可为枚举值创建一个标签名称
export interface LabelValue{
    label?: string,
    value: string | number //: Int, Long, Double, String, DateTime
}
//export type BasicValueType =  boolean | string | number 
export interface JsonValue {
    _class: string, //backend ktorkit lib set: classDiscriminator="_class"
    raw?: boolean | string | number  | (string| number)[] | LabelValue | LabelValue[] //有LabelValue是因为常量中枚举常量的值可能需要创建标签
    value?:boolean | string | number  | (string| number)[] | LabelValue | LabelValue[] //旧值
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
    extra?: string //附加信息 自动来自ParamCategory 或自行填写

    remark?: string, //备注

    domain?: Domain
    domainId?: number

    paramType: ParamType,
    typeId: number,

    categoryId?: number,
    paramCategory?: ParamCategory,

    valueScopeIds?: string, //值范围来自哪些常量的id
    valueScopes?: Constant[],//临时值
    constantIds?: number[] //临时保存的值
}
export interface ParamQueryParams extends BasePageQuery {
    label?: string
    typeId?: number
    mapKey?: string
    domainId?: number
    categoryId?: number
}

export interface ParamCategoryQueryParams extends BasePageQuery {
    label?: string
    domainId?: number
    typeId?: number //非空表示只需要该类型下的树
    setupChildren: boolean //在通过分类选择变量时设置为true
}
export interface ParamCategory extends LabeldBean{
    extra?: string //附加信息
    domainId?: number, //domain.id
    domain?: Domain, 
    children?: Param[]
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
export interface BaseExpressionRecord extends LabeldBean {
    key?: string //临时构建的id值，ComplexExpressionEditor中的Transfer使用它作为id键
    
    type: 'Basic' | 'Complex'
    remark?: string//备注

    domain?: Domain
    domainId?: number

    exprStr?: string,//json of Expression
    metaStr?: string,//json of ExpressionMeta
}
export interface BasicExpressionRecord extends BaseExpressionRecord {
    expr?: BasicExpression
    meta?: BasicExpressionMeta//json of ExpressionMeta
}
export interface ComplexExpressionRecord extends BaseExpressionRecord {
    expr?: ComplexExpression
    meta?: ComplexExpressionMeta
}
export type ExpressionRecord = BasicExpressionRecord | ComplexExpressionRecord


interface ExpressionMetaBase{
    _class: string, //'Bool' | 'Int' | 'Double' | 'Long' | 'String' ....
    opId?: number,
    op?: Opcode,
}
export interface BasicExpressionMeta extends ExpressionMetaBase{
    paramId?: number | number[],//与mapKey&paramTypeId二选一
    param?: Param,

    paramTypeId?: number,
    paramType?: ParamType,
    mapKey?: string,
    extra?: string

     //使用Map<string, OperandValueMeta>时，在parse成对象时得到是object，而不是map
     //现改成object，key为操作数键值，值为OperandValueMeta
    operandMetaObj: {[key:string]: OperandValueMeta} 
}

export interface ComplexExpressionMeta  extends ExpressionMetaBase{
    _class: "Complex",
    metaList: (BasicExpressionMeta | ComplexExpressionMeta)[]
}
export type ExpressionMeta = BasicExpressionMeta | ComplexExpressionMeta


export interface Expr {
    _class: string, //后端需要做序列化
    op: string //Opcode.code
}
export interface BasicExpression extends Expr {
    key: string//值为: BasicExpressionMeta.param.mapKey
    extra?: string //附加信息 协助key进行取值，如来自ParamCategory的附属分类信息
    operands: {[key: string]: OperandValue}//Map<String, Operand>
}
export interface ComplexExpression extends Expr {
    //op: string
    exprs: (BasicExpression|ComplexExpression)[]
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
export interface OperandValueMeta {
    valueType?: "Param" | "Constant" | "JsonValue" | undefined
    paramId?: number | number[] //为数组时，表示EnableParamCategory = true
    param?: Param
    constantIds?: string | number | (string | number)[] | (string | number)[][] //eg.树形select的option的value 树形单选：[1, "乙"] 以及 [4]；多选选中多个[[1, '甲'],[1, '乙'],[1, '丁']]，多选全部选中：[[1]]
    //constants?: Constant[]
    jsonValue?: JsonValue
}
export interface OperandValue {
    valueType?: "Param" | "Constant" | "JsonValue" | undefined
    key?: string // for Param type
    value?: JsonValue
}

 
export interface RuleQueryParams extends BasePageQuery{
    label?: string,
    domainId?: number,
    enable?: number,
    tags?: string,
    threshhold?: number
    level?:number
    id?: number
}

export interface RuleCommon{
    posPath: string[], // parent: Rule.id or RuleGroup.id
    rule?: Rule,//RuleCommon数据来源Rule
    ruleGroup?: RuleGroup,//RuleCommon数据来源RuleGroup
    
    id: number, //不再使用这种方式：md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
    typedId: string,//添加前缀rule和group用于区分类型，parentPath查找时区分类型
    level?: number,
    label?: string,
    priority?: number ,
    remark?: string,
    enable: number ,
    tags?: string, 
    domainId?: number,
    domain?: Domain, //前端列表数据需要
    children?: RuleCommon[],
    exclusive: number,
    description?:string
}


export interface Rule extends BaseRecord {
    id: number, //md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
    level: number
    label?: string,
    priority?: number,
    remark?: string,
    description?:string,
    exprRemark?: string,//对表达式的备注说明
    enable: number // default true,
    
    tags?: string,
    tagList?: string[] //only for front end

    threshhold?: number, //percent

    exprId?: number,//if exprId not null, use it 如果exprId非空，则exprStr和metaStr来自Expression记录；否则由前端编辑时提供
    exprStr?: string,//json string of LogicalExpr
    metaStr?: string,//json string of ExpressionMeta

    thenAction?: string,// if do
    elseAction?: string, //else do

    domainId?: number,
    domain?: Domain, //only for front 前端列表数据需要

    expr? : BasicExpression | ComplexExpression,// only for front end 由exprStr解析或前端提供
    meta?: BasicExpressionMeta | ComplexExpressionMeta//only for front end 由metaStr解析或前端提供

    ruleChildrenIds?: string, // json string of Rule.id List, 后端维护该值，前端不做任何变动，insert/save one when create a child in front end
    ruleGroupChildrenIds?: string,// json string of RuleGroup.id List, 后端维护该值，前端不做任何变动，insert one when create a child in front end
   
    ruleParentIds?: string, // json string of Rule.id List, 后端维护该值，前端不做任何变动，insert/save one when create a child in front end
    ruleGroupParentIds?: string,// json string of RuleGroup.id List,后端维护该值，前端不做任何变动， insert one when create a child in front end
    

    exclusive?: number // default false,
    //ruleParentIdList?: string[], //only for frontend
    //ruleGroupParentIdList?: string[]//only for frontend

    //ruleChildren?: Rule[],//setup from backend for frontend tree
     //ruleGroupChildren?: RuleGroup[]//setup from backend for frontend tree
    
}


export interface RuleGroupQueryParams extends BasePageQuery{
    label?: string,
    domainId?: number,
    enable?: number
    level?:0
}
export interface RuleGroup extends BaseRecord {
    id: number, //md5(domainId=xx&key=xx&op=xx&valueType=xx&value=xx)
    level: number
    label: string,
    exclusive: number // default true,
    enable: number // default true,
    
    tags?: string,
    tagList?: string[] // only for front end

    remark?: string,
    priority?: number,

    domainId?: number,
    domain?: Domain,//only for front end

    ruleChildrenIds?: string, // json string of Rule.id List, 后端维护该值，前端不做任何变动，insert/save one when create a child in front end
    ruleGroupChildrenIds?: string,// json string of RuleGroup.id List, 后端维护该值，前端不做任何变动，insert one when create a child in front end

    ruleParentIds?: string, // json string of Rule.id List, 后端维护该值，前端不做任何变动，insert/save one when create a child in front end
    ruleGroupParentIds?: string,// json string of RuleGroup.id List, 后端维护该值，前端不做任何变动，insert one when create a child in front end

    //ruleParentIdList?: string[], //only for frontend
    //ruleGroupParentIdList?: string[]//only for frontend

    //ruleChildren?: Rule[],//setup from backend for frontend tree
     //ruleGroupChildren?: RuleGroup[]//setup from backend for frontend tree
}

export interface RuleActionQueryParams extends BasePageQuery{
    actionKey?: string,
}
export interface RuleAction extends LabeldBean{
    actionKey: string,
    remark?: string
}