/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-08-25 15:38
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




class RuleEngine {

    fun eval(rules: List<IRule>, dataPicker: (String) -> Any?,
             thenAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean)?,
             elseAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean)? = null)
    {
        rules.forEach {
            it.eval(dataPicker, null, thenAction, elseAction)
        }
    }

    private val actionMap = mutableMapOf<String, Action>()
    fun registerAction(key: String, remark: String? = null, action: (currentRule: IRule, parentRule: IRule?) -> Unit){
        actionMap[key] = Action(key, remark, action)
    }
    fun registerAction(action: Action){
        actionMap[action.key] = Action(action.key, action.remark, action.action)
    }
    fun unregisterAction(key: String){
        actionMap.remove(key)
    }
    fun unregisterAction(action: Action){
        actionMap.remove(action.key)
    }
    fun getActions() =  actionMap.toMap()


    fun registerIdCollector(): TreeNode<String>{
        val collector = ResultCollector{ it.id }
        val action = Action("idCollector", "collect ID of Rule/RuleGroup whose conditrion is true"){currentRule, parentRule->
            collector.collect(currentRule, parentRule)
        }
        registerAction(action)
        return collector.root
    }
}