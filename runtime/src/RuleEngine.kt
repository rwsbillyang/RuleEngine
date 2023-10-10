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
 * 执行规则：
 * 对根规则使用toEvalRule进行转换，然后执行：
 * 若match，则由collector收集，并执行规则的action或RuleEngine中的默认action
 * 并且调用loadChildrenFunc继续加载子规则，重复相同过程
 *
 * 执行规则的逻辑表达式，则是根据表达式的key，由dataPicker提供值
 * */
object RuleEngine {
    /**
     * @param rootRules 当前待执行的数据库规则实体，即规则树的起点
     * @param dataProvider 根据key获取对应的变量值
     * @param loadChildrenFunc 获取当前数据库规则实体的子实体，通常从数据库中查询当前规则的子规则
     * @param toEvalRule 将数据库规则实体转换为可执行的EvalRule
     * @param collector 提供的话则收集匹配的规则，类型T为需收集的数据类型，需提供如何将数据库规则实体转换为T和唯一键值的函数
     * */
    fun <T> eval(
        rootRules: List<Any>,
        dataProvider: (key: String, keyExtra:String?) -> Any?,
        loadChildrenFunc: (parent: Any?) -> List<Any>?,
        toEvalRule: (entity: Any) -> EvalRule,
        collector: ResultTreeCollector<T>?
    )
    {
        rootRules.map{ toEvalRule(it) }.forEach {
            it.eval(dataProvider, loadChildrenFunc, toEvalRule, null, collector)
        }
    }

    /**
     * 若数据库规则实体中无action，若存在此defaultAction，将使用此默认defaultAction
     * */
    var defaultAction: Action? = null

    /**
     * 若数据库规则实体中无else时的action，若存在此defaultElseAction，将使用此默认defaultElseAction
     * */
    var defaultElseAction: Action? = null

    private val actionMap = mutableMapOf<String, Action>()

    /**
     * 注册一个自己的action，rule中设置的action将根据注册情况查找对应的action
     * */
    fun registerAction(key: String,  action: Action){
        actionMap[key] = action
    }

    /**
     * 注销一个action
     * */
    fun unregisterAction(key: String){
        actionMap.remove(key)
    }

    /**
     * 根据key获取action
     * */
    fun getAction(key: String) = actionMap[key]

    /**
     * 获取全部action
     * */
    fun getActions() =  actionMap.toMap()

}