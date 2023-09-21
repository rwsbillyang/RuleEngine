/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-08-28 20:32
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.github.rwsbillyang.ruleEngine.core.rule


class TreeNode<T>(
    val data: T?,
    val parents: MutableList<String> = mutableListOf(),
    val children: MutableList<String> = mutableListOf()
)

/**
 * data（自己任意定义的类型T）收集器，需提供一个命中的EvalRule到T的转换器
 * 最终结果保存在收集器的resultMap中，它是一个有着指向父子节点的树形结构，而root是其起始节点
 *
 * @param nodeDataPicker 将当前命中的EvalRule转换为Pair，其中第一个为唯一键值，第二个是自定义的data
 * 两个值将被保存到resultMap中，并构建亲子关系节点
 * */
class ResultTreeCollector<T>(
    val nodeDataPicker: (EvalRule)-> Pair<String, T>)
{
    val root: TreeNode<T> = TreeNode(null)
    val resultMap: MutableMap<String, TreeNode<T>> = mutableMapOf()

    /**
     * 收集结果
     * */
    fun collect(currentRule: EvalRule, parentRule: EvalRule?){
        val pair = nodeDataPicker(currentRule)
        val childKey = pair.first
        val currentNode = resultMap[childKey]?:TreeNode(pair.second)
        resultMap[childKey] = currentNode

        if(parentRule == null)
        {
            root.children.add(childKey)
            println("add top key: $childKey")
        }else{
            val pair2 = nodeDataPicker(parentRule)
            val parentKey = pair2.first
            val parentNode = resultMap[parentKey]?:TreeNode(pair2.second)
            resultMap[parentKey] = parentNode
            parentNode.children.add(childKey)
            currentNode.parents.add(parentKey)
        }
    }

    /**
     * 对结果进行doSth操作
     * */
    fun traverseResult(rootNode: TreeNode<T> = root, doSth: (TreeNode<T>) -> Unit){
        rootNode.children.forEach{
            val node = resultMap[it]
            if(node != null){
                doSth(node)
                traverseResult(node,doSth)
            }else{
                System.err.println("no treeNode, but has key=$it")
            }
        }
    }
}

