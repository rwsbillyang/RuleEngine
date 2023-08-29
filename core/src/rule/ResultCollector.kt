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
    val parents: MutableList<TreeNode<T>> = mutableListOf(),
    val children: MutableList<TreeNode<T>>  = mutableListOf()
)

class ResultCollector<T>(
    val root: TreeNode<T> = TreeNode(null),
    val nodeDataPicker: (IRule)-> T )
{
    val map: MutableMap<T, TreeNode<T>> = mutableMapOf()

    fun collect(currentRule: IRule, parentRule: IRule?){
        val currentNode = TreeNode(nodeDataPicker(currentRule))
        map[nodeDataPicker(currentRule)] = currentNode

        if(parentRule == null)
        {
            root.children.add(currentNode)
        }else{
            val parentKey = nodeDataPicker(parentRule)
            val parentNode = map[parentKey]?:TreeNode(nodeDataPicker(parentRule))
            parentNode.children.add(currentNode)
            currentNode.parents.add(parentNode)
        }
    }
}

