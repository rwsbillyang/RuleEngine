import React, { useEffect, useRef, useState } from 'react';
import { Dropdown, Form, MenuProps, Tooltip, Transfer, message } from 'antd';
import type { TransferDirection, TransferListProps } from 'antd/es/transfer';
import { cachedGet, Cache } from "@rwsbillyang/usecache"
import { BasicExpressionMeta, BasicExpressionRecord, ComplexExpressionMeta, ComplexExpressionRecord, Expression, ExpressionQueryParams, Operator, OperatorQueryParams } from '../DataType';

import { Host } from '@/Config';
import { ModalForm, ProFormInstance, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { asyncSelectProps2Request } from '@/myPro/MyProTableProps';
import { basicExprRecord2String, basicMeta2Expr, complexExprRecord2String, complexMeta2Expr, meta2Expr, sortedConcat } from '../utils';
import md5 from "md5"
import { BasicExprMetaEditModal } from './BasicExprMetaEditModal';


const ExpressionKeyPrefix = "complexExpression/domain/"
const LogicalOpKey = "op/Logical"
/**
 *  ComplexExpressionMeta编辑器 Modal对话框
 * 
 * 包含了隐藏的_class字段、逻辑运算符选择，
 * 以及一个 (BasicExpressionMeta | ComplexExpressionMeta) 列表编辑器Transfer
 *  Transfer左侧显示当前可供选择的表达式，可将左侧表达式添加到右侧
 * 左侧底部按钮用于创建一个新的基本表达式，作为源;
 * 右侧底部按钮用于当前列表中的表达式用逻辑操作符连接起来，并继续添加到左侧，构造一个复合表达式，作为源;
 * 
 * Modal底部OK按钮，用于将右侧列表中的表达式连接起来，构造一个复合表达式，作为结果在onFinish中返回
 * 
 * 共同构成一个对话框，点击对话框后，父组件通过提供的onDone获取到ComplexExpressionMeta的值
 * 
 * @param title 展示的名称，如需自定义可指定
 * @param triggerName trigger中名称，如需自定义可指定
 * @param domainId
 * @param onDone 完成后执行的回调
 * @param exprId 选择一个现有的表达式记录，来自于哪个expression id
 * @param meta 初始值ComplexExpressionMeta
 * @param cannotChooseOne 若为true则不能选择现有的表达式，只能新建或编辑一个BasicExpressionMeta，适用于Record的新增或编辑
 */
export const ComplexExprMetaEditModal: React.FC<{
    title?: string,
    triggerName?: string,
    domainId?: number,
    onDone: (meta: ComplexExpressionMeta, newExprId?: number) => void,
    exprId?: number,
    meta?: ComplexExpressionMeta
    cannotChooseOne?: boolean
}> = ({ title, triggerName, domainId, onDone, exprId, meta, cannotChooseOne }) => {
    const [newMeta, setNewMeta] = useState(meta)
    const [newExprId, setNewExprId] = useState(exprId)

    //transfer left list
    const [exprList, setExprList] = useState<(BasicExpressionRecord | ComplexExpressionRecord)[]>(destructComplexMetaList(meta?.metaList));

    //transfer right list
    const [targetKeys, setTargetKeys] = useState<string[]>(getTargetKeysByMeta(meta));



    const formRef = useRef<ProFormInstance>()

    const getAllExpr = () => {
        cachedGet<(BasicExpressionRecord | ComplexExpressionRecord)[]>(`${Host}/api/rule/composer/list/expression`, (data) => {
            
            let flag = false
            data.forEach((e) => {
                if(e.exprStr){
                     e.expr = JSON.parse(e.exprStr)
                     e.key = md5(sortedConcat(e.expr))
                     flag ||= pushIfNotPresent(exprList, e, "key") //metaList.push(meta)
                     console.log("express, label=" + e.label + ", e.key=" + e.key)
                }
            })
            if (flag) setExprList([...exprList])
            console.log("exprList=",exprList)
        },
            { domainId: domainId, pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载)
            "expression/domain/" + domainId)
    }


    //加载domainId下所有表达式， 用于放置在transfer的左侧
    useEffect(() => {
        getAllExpr()
    }, [])


    useEffect(() => {
        if (newExprId) {
            const expression: Expression | undefined = Cache.findOne(ExpressionKeyPrefix + domainId, newExprId, "id")
            const meta = expression?.metaStr ? JSON.parse(expression?.metaStr) : undefined
            //console.log("=====update newMeta by newExprId=" + newExprId, meta)

            if (meta) {
                setNewMeta(meta)
                setExprList(destructComplexExpression(expression))
                setTargetKeys(getTargetKeysByExpr(expression))

                formRef?.current?.setFieldValue("opId", meta?.opId)
            } else {
                console.log("shold not come here: changed exprId=" + newExprId + ", but no expression or expression.metaStr")
            }
        } else {//清空了exprId
            console.log("no exprId, to reset")
        }

    }, [newExprId])



    //transfer foot
    const renderFooter = (props: TransferListProps<BasicExpressionRecord | ComplexExpressionRecord>, info?: {
        direction: TransferDirection;
    }) => {
        if (!info || info?.direction === 'left') {
            return (
                <BasicExprMetaEditModal cannotChooseOne={true} triggerName="新增基本表达式" domainId={domainId} onDone={(v) => {
                    const mockExpr: BasicExpressionRecord = {key:md5(sortedConcat(meta2Expr(v))), meta: v, type: "Basic", label:"临时新增" } 
                    if (pushIfNotPresent(exprList, mockExpr, "key")) //metaList.push(v)
                        setExprList([...exprList])
                }} />
            );
        } else
            return (
                <LogicalExprDropDwon disabled={targetKeys.length < 2} title="添加到左侧" onClick={(op) => {
                    const list = getByIds(exprList, targetKeys, "key")
                    if (list?.length === targetKeys.length) {
                        const metaList = list.map((e)=>e.meta).filter((e)=>!!e) as (BasicExpressionMeta | ComplexExpressionMeta)[]
                        const meta: ComplexExpressionMeta = {
                            _class: "Complex",
                            op: op,
                            opId: op.id,
                            metaList: metaList
                        }
                        const mockExpr: ComplexExpressionRecord = {
                            label: "临时新增",
                            type: "Complex",
                            meta: meta,
                            key: md5(sortedConcat(meta2Expr(meta)))
                        }
                        
                       
                        if (pushIfNotPresent(exprList, mockExpr, "key")) //metaList.push(meta)
                        {
                            setExprList([...exprList])
                            setTargetKeys([])
                            console.log("successful to add one complexExpressionMeta to left")
                        } else {
                            console.log("left already exsit")
                        }

                    } else {
                        console.warn("fail to get metaList from targetKeys=", targetKeys)
                    }

                }} />
            );
    };



    return <ModalForm<ComplexExpressionMeta>
        formRef={formRef}
        layout="horizontal"
        title={title || "编辑复合表达式"}
        trigger={<a >{triggerName || "编辑"}</a>}
        autoFocusFirstInput
        modalProps={{
            destroyOnClose: false,
        }}
        submitTimeout={2000}
        onValuesChange={(v) => {
            // console.log("onValuesChange:" + JSON.stringify(v))
            //现有表达式选择变化 -> 此处执行 -> newExprId变化 -> useEffect中切换 metaList和targetKeys、opId操作符变化 -> UI中transfer变化
            //若是清空，导致transfer左侧使用所有表达式，右侧为空 
             //exprId清空(先不为空，后为空)才执行
            if(newExprId && !v?.exprId){ // 其它字段修改，该条件也成立
                setNewMeta(undefined)
                getAllExpr()
                setTargetKeys([])
                formRef?.current?.setFieldValue("opId", undefined)
            }
            setNewExprId(v?.exprId)

        }}
        onFinish={async (values) => {
            console.log("ComplexExpressionMetaEditorModal: ModalForm.onFinish: values=", values);

            const list = getByIds(exprList, targetKeys, "key")
            if (!list || list.length < 2) {
                message.warning("已选表达式至少2个以上，才可进行逻辑运算")
                return false
            } else {
                values.metaList = list.map((e)=>e.meta)
                values.op = Cache.findOne(LogicalOpKey, values.opId, "id") //opId是form中的一个字段，已在values之中

                onDone(values, newExprId)
                return true
            }

        }} >

        <ProFormText hidden name="_class" initialValue="Complex" />

        <ProFormSelect
            name="exprId"
            label="现有复合表达式"
            hidden={cannotChooseOne}
            tooltip="使用现有表达式，或新创建一个"
            request={cannotChooseOne ? undefined : () => asyncSelectProps2Request<Expression, ExpressionQueryParams>({
                key: ExpressionKeyPrefix + domainId, //与domain列表项的key不同，主要是：若相同，则先进行此请求后没有设置loadMoreState，但导致列表管理页因已全部加载无需展示LoadMore，却仍然展示LoadMore
                url: `${Host}/api/rule/composer/list/expression`,
                query: { domainId: domainId, type: "Complex", pagination: { pageSize: -1, sKey: "id", sort: 1 } }, //pageSize: -1为全部加载
                convertFunc: (item) => {
                    return { label: item.label, value: item.id }
                }
            })}
        />

        <Form.Item label="表达式列表" required rules={[{ required: true, message: '必选' }]}>
            <Transfer
                dataSource={exprList}
                titles={['候选表达式', '已选表达式']}
                listStyle={{
                    width: "100%",
                    height: 300,
                }}
                targetKeys={targetKeys}
                onChange={(newTargetKeys: string[]) => {
                    setTargetKeys(newTargetKeys);
                }}
                render={(item) => {
                    if (item.type === "Complex") {
                        return complexExprRecord2String(item as ComplexExpressionRecord)
                    } else {
                        return basicExprRecord2String(item as BasicExpressionRecord)
                    }
                }}
                footer={renderFooter}
            />
        </Form.Item>

        <ProFormSelect
            name="opId"
            initialValue={newMeta?.opId}
            tooltip="已选表达式以何种方式进行逻辑运算"
            label="逻辑运算符"
            rules={[{ required: true, message: '必选' }]}

            request={(params) => asyncSelectProps2Request<Operator, OperatorQueryParams>({ //params为注入的dependencies字段值： {isEnum: true}
                key: LogicalOpKey,//不提供key，则不缓存，每次均从远程请求
                url: `${Host}/api/rule/composer/list/operator`,
                query: { type: "Logical", pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载
                convertFunc: (item) => {
                    return { label: item.label + "(" + item.code + ")", value: item.id }
                }
            })}
        />

    </ModalForm>
}


/**
 * 根据id数组，从数组中获取对应的全部元素
 * @param array 
 * @param ids 
 * @param idKey 
 * @returns 
 */
function getByIds<T>(array: T[], ids?: string[] | number[], idKey: string = "id") {
    if (!array || array.length === 0 || !ids || ids.length === 0) return undefined
    const ret: T[] = []
    for (let i = 0; i < array.length; i++) {
        inner: for (let j = 0; j < ids.length; j++) {
            if (array[i][idKey] === ids[j]) {
                ret.push(array[i])
                break inner
            }
        }
    }
    return ret
}
/**
 * 
 * @param array 若数组中已存在，则忽略，否则push进去
 * @param id 
 * @param idKey 
 * @returns 添加成功则返回true
 */
function pushIfNotPresent<T>(array: T[], e: T, idKey: string = "id") {
    for (let i = 0; i < array.length; i++) {
        if (array[i][idKey] === e[idKey]) {
            return false
        }
    }
    array.push(e)
    return true
}
/**
 * 给表达式记录项添加md5 key，添加到exprList中；容易是复合表达式记录项，拆解出各基本表达式，构造临时模拟记录，并给它们添加上key
 * @param meta 
 */
function destructComplexExpression(e?: (BasicExpressionRecord | ComplexExpressionRecord), result?: (BasicExpressionRecord | ComplexExpressionRecord)[]) {
    const list = result || []
    if (!e) return list

    if(!e.expr && e.exprStr) e.expr = JSON.parse(e.exprStr)
    if(!e.meta && e.metaStr) e.meta = JSON.parse(e.metaStr)

    e.key = md5(sortedConcat(e.expr))
    list.push(e)

    if(e.type === "Complex"){
        const expr = e as ComplexExpressionRecord
        destructComplexMetaList(expr.meta?.metaList, expr, list)
    }

    return list
}
function destructComplexMetaList(metaList?:  (BasicExpressionMeta | ComplexExpressionMeta)[], expr?: ComplexExpressionRecord, result?: (BasicExpressionRecord | ComplexExpressionRecord)[]) {
    const list = result || []
    if (!metaList) return list

    metaList.forEach((e)=>{
        if(e._class === "Complex"){
            const meta = e as ComplexExpressionMeta
            destructComplexMetaList(meta.metaList,expr, result)
            const mockExpr:  ComplexExpressionRecord = {label: (expr?.label || "未命名"), meta, key: md5(sortedConcat(complexMeta2Expr(meta))),type: "Complex"}
            list.push(mockExpr)
        }else{
            const meta = e as BasicExpressionMeta
            const mockExpr:  BasicExpressionRecord = {label: (expr?.label || "未命名"), meta, key: md5(sortedConcat(basicMeta2Expr(meta))),type: "Basic"}
            list.push(mockExpr)
        }
    });
    return list
}

function getTargetKeysByExpr(expr?: (BasicExpressionRecord | ComplexExpressionRecord)) {
    const list: string[] = []
    if (!expr || expr.type !== "Complex" ) return list
    const expr2 = expr as ComplexExpressionRecord
    expr2.meta?.metaList?.forEach((e, i) => {
        list.push(md5(sortedConcat(meta2Expr(e)))) 
    })

    return list
}
function getTargetKeysByMeta(meta?: ComplexExpressionMeta) {
    const list: string[] = []
    if (!meta || meta._class !== "Complex" ) return list

    meta.metaList?.forEach((e, i) => {
        list.push(md5(sortedConcat(meta2Expr(e)))) 
    })

    return list
}
/**
 * 逻辑表达式操作符选择下拉DropDwon
 * @param title 展示的名称
 * @param disabled 是否激活，当表达式列表为空时，应为true
 * @param onClick 点击选中哪个操作符
 * @returns 
 */
const LogicalExprDropDwon: React.FC<{ title?: string, disabled?: boolean, onClick: (e: Operator) => void }> = ({ title, disabled, onClick }) => {
    const [ops, setOps] = useState<Operator[]>([])
    useEffect(() => {
        cachedGet<Operator[]>(`${Host}/api/rule/composer/list/operator`, (data) => setOps(data),
            { type: 'Logical', pagination: { pageSize: -1, sKey: "id", sort: 1 } },//pageSize: -1为全部加载)
            "ops/Logical")
    }, [])

    const onClick2: MenuProps['onClick'] = ({ key }) => {
        const e = Cache.findOneInArray(ops, key, "code")
        if (e) onClick(e)
        else console.log("clicked key=" + key + ", but not found in ops=", ops)
    };

    // return <Select disabled={disabled} options={ops?.map((e) => ({
    //   label:  e.label,
    //   value: e.code
    // }))}/>


    return <Dropdown.Button
        menu={{
            items: ops?.map((e) => ({
                label: e.label,
                key: e.code,
            })), onClick: onClick2
        }}
        buttonsRender={([leftButton, rightButton]) => [
            <Tooltip title="已选表达式经过哪种逻辑运算，添加到左侧候选表" key="leftButton">
                {leftButton}
            </Tooltip>,
            React.cloneElement(rightButton as React.ReactElement<any, string>),
        ]}
    >
        {title}
    </Dropdown.Button>
}
