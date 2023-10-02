import React, { useMemo, useRef } from "react"
import { RuleCommon } from "../DataType"

import {  Modal, TreeSelect, message } from "antd"

const { confirm } = Modal;
import { ExclamationCircleFilled } from '@ant-design/icons';

import { RuleName, rubleTableProps } from "./RuleTable"

import { moveInNewParent } from "./RuleCommon"

import { DefaultOptionType } from "antd/es/select"
import { RuleGroupName, rubleGroupTableProps } from "./RuleGroupTable"
import { ArrayUtil } from "@rwsbillyang/usecache"


//设置该参数后，展示对话框，移动节点
export interface MoveNodeParam {
    fromTable: string,
    currentRow: RuleCommon,
    list: RuleCommon[]
}
export interface MoveNodeParamWithParent extends MoveNodeParam{
    tableProps: any // MyTableProps
    oldParent?: RuleCommon
    newParent?: RuleCommon
}
export const MoveIntoNewParentModal: React.FC<{ param?: MoveNodeParam, setParam: React.Dispatch<React.SetStateAction<MoveNodeParam | undefined>>}> = ({ param, setParam }) => {
    //const [isModalOpen, setIsModalOpen] = useState(!!param);
    //const [param, setParam] = useState(moveParam)
    if (!param) return null

    const tableProps = param.fromTable === RuleName ? rubleTableProps : (param.fromTable === RuleGroupName ? rubleGroupTableProps : undefined)
    if(!tableProps){
        console.warn("should not come here, fromTable should be RuleName or RuleGroupName")
        message.warning("not found tableProps, fromTable wrong?")
        return null
    }

    const mockRootId = param.fromTable + "-root"
    const p: MoveNodeParamWithParent = {... param, tableProps} 
    const idKey = tableProps.idKey || "typedId"

    const oldParentPath = param.currentRow.parentPath //顶级节点中只有自己的id
    if (oldParentPath.length > 1) {
        const elemPath = ArrayUtil.getArrayByPathInTree(param.list, oldParentPath, idKey)//树形数据转换成数组
        if (elemPath && elemPath.length > 1) {
            p.oldParent = elemPath[elemPath.length - 2]
        }
    }else{
        //旧父节点为模拟根节点
    }

    const currentPathStr = mockRootId + (p.oldParent?.parentPath ? (","+ p.oldParent.parentPath.join(",")) : "")
    const { current } = useRef<{ pathStr: string}>({ pathStr: currentPathStr}) //用于记录选择的父节点
  
    const tree = useMemo(()=>{
        const treeData: DefaultOptionType[] = [{
            label: "根节点",
            title: "根节点",
            value: mockRootId, //value为从根节点到自己的typedId
            children: ArrayUtil.traverseTree(param.list || [], (e) => {
                //在path数组头添加mockRoot，去掉最后一个元素（自己），使path为mockRoot->parent
                const newPath: string =  mockRootId + "," +  e.parentPath.join(",")//value为从根节点到自己的typedId
                
                //自己以及自己的子节点，设置为disabled，避免将自己移动到自己的子节点下，避免循环嵌套
                const disabled = newPath.indexOf(currentPathStr) >= 0 //e.typedId === param.currentRow.typedId
                //TODO：不支持某个节点及子节点设置为收缩状态
                const o: DefaultOptionType = { label: e.label, title: e.label, value: newPath, disabled: disabled }
                return o
            })
        }]
    
        console.log("treeData=",treeData)
        return treeData
    }, [param.list])
    
    
    
    

    return <Modal title= {"移动节点：" + param.currentRow.label} 
        open={!!param}
        onOk={() => {
            if(currentPathStr === current.pathStr){
                message.warning("请选择不同的节点作为父节点")
                return
            }
            if (current.pathStr) {
                console.log("move into new parent")

                const newParentPath = current.pathStr.split(",") //mockRoot->parent的节点路径
                if(newParentPath){
                    if(newParentPath.length === 1){
                        console.log("move into mock root node")
                    }else{
                        const elemPath = ArrayUtil.getArrayByPathInTree(param.list, newParentPath, idKey)//树形数据转换成数组
                        if (elemPath) {
                            const newParent = elemPath[elemPath.length - 1]
                            if(newParent){
                               // const t = newParent.rule?  RuleName : (newParent.ruleGroup ? RuleGroupName : moveParam.fromTable)
                               // postData.newParent = {id: newParent.id, type: t }
                               p.newParent = newParent
                            }else{
                                console.warn("should not come here, not found new parent: path=" + current.pathStr)
                                message.warning("没找到新的父节点")
                                return
                            }
                        }
                    }  
                }

                if(!p.oldParent && !p.newParent){
                    message.warning("都在根节点下？")
                    return
                }

                confirm({
                    title: `确定要移动到新节点下?`,
                    icon: <ExclamationCircleFilled />,
                    content: `移动节点'${param.currentRow.label}': '${p.oldParent?.label ? p.oldParent.label : "根节点"}' -> '${p.newParent?.label? p.newParent.label :"根节点"}' 下?`,
                    onOk() { 
                        console.log("param=", p)
                        return moveInNewParent(p) 
                    },
                    onCancel() { },
                })
            }
            //setIsModalOpen(false)
            setParam(undefined)
        }}
        onCancel={() => {
            //setIsModalOpen(false)
            //onCancelModal()
            setParam(undefined)
            }}>
        <TreeSelect
            style={{ width: '100%' }}
            //dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            defaultValue={current.pathStr}
            placeholder="选择父节点"
            treeDefaultExpandAll
            onChange={(v) => current.pathStr = v}
            treeData={tree}
        />
    </Modal>

}