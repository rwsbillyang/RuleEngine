/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-09-25 09:01
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

package com.github.rwsbillyang.rule.runtime


/**
 * 用于构建树形节点
 * */
class TreeNode<T>(
    val data: T?,
    val parents: MutableList<String> = mutableListOf(),
    val children: MutableList<String> = mutableListOf()
)


/**
 * 规则运行结果收集器，T是自己定义的任意收集结果类型，需提供一个命中的EvalRule到T的转换器
 * 最终结果保存在收集器的resultMap中，它是一个有着父子相互指向对方节点的树形网状结构，
 * 而root是其起始节点,root中的parents将为空，其children是命中的顶部节点列表
 *
 * @param nodeDataPicker 将当前命中的EvalRule转换为Pair，Pair第一个参数为唯一键值，第二个是自定义的data结果数据
 * 两个值将被保存到resultMap中，并构建亲子关系节点
 *
 * */
class ResultTreeCollector<T>(
    val nodeDataPicker: (LogicalEvalRule<T>)-> Pair<String, T>)
{
    val root: TreeNode<T> = TreeNode(null)
    val resultMap: MutableMap<String, TreeNode<T>> = mutableMapOf()

    /**
     * 收集结果
     * */
    fun collect(currentRule: LogicalEvalRule<T>, parentRule: LogicalEvalRule<T>?){
        val pair = nodeDataPicker(currentRule)
        val childKey = pair.first
        val currentNode = resultMap[childKey]?: TreeNode(pair.second)
        resultMap[childKey] = currentNode

        if(parentRule == null)
        {
            root.children.add(childKey)
            //println("add top key: $childKey")
        }else{
            val pair2 = nodeDataPicker(parentRule)
            val parentKey = pair2.first
            val parentNode = resultMap[parentKey]?: TreeNode(pair2.second)
            resultMap[parentKey] = parentNode
            parentNode.children.add(childKey)
            currentNode.parents.add(parentKey)
        }
    }

    /**
     * 对rootNode进行深度遍历doSth操作, 从rootNode的children开始遍历, rootNode除外
     * @param rootNode 虚拟根节点
     * @param doSth 执行的操作
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

    private fun setupList(list: MutableList<T>, rootNode: TreeNode<T>) {
        rootNode.children
            .mapNotNull { resultMap[it] }
            //.sortedWith(comparator)
            .forEach{
                if(it.data != null) list.add(it.data)
                setupList(list, it)
            }
    }
    /**
     * 对rootNode进行广度遍历构建LinkList操作, 从rootNode的children开始遍历, rootNode除外
     * @param rootNode 虚拟根节点
     * @param skipNode 是否跳过节点
     * */
    fun asList(rootNode: TreeNode<T> = root,skipNode: ((T) -> Boolean)? = null): List<T>{
        val list = mutableListOf<T>()

        setupList(list, rootNode)

        return if(skipNode == null) list
        else list.filter { !skipNode(it) }
    }
}

