/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-05-31 11:57
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

import com.github.rwsbillyang.ruleEngine.core.expression.LogicalExpr

interface IRule{
    val id: String
    fun eval(dataPicker: (key: String) -> Any?,parentRule: IRule?,
             thenAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean) ? = null,
             elseAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean) ? = null): Boolean
}

/**
 * @param id rule id
 * @param logicalExpr condition
 * @param customThenAction 若提供，则使用它，否则使用eval函数中的thenAction
 * @param customElseAction2 若提供，则使用它，否则使用eval函数中的elseAction
 * */
class Rule(
    override val id: String,
    val logicalExpr: LogicalExpr,
    val children: List<IRule>? = null,
    val customThenAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean) ? = null,
    val customElseAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean) ? = null
): IRule{
    override fun eval(dataPicker: (String) -> Any?, parentRule: IRule?,
                      thenAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean) ? ,
                      elseAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean) ?): Boolean {
        if(logicalExpr.eval(dataPicker)){
            (customThenAction?:thenAction)?.let { it(this, parentRule) }
            if(!children.isNullOrEmpty()){
                children.forEach { it.eval(dataPicker, this,thenAction, elseAction) }
            }
            return true
        }else{
            (customElseAction?:elseAction)?.let { it(this, parentRule) }
            return false
        }
    }

}


class RuleGroup(
    override val id: String,
    val exclusive: Boolean = true,
    val children: List<IRule>
): IRule{
    override fun eval(dataPicker: (String) -> Any?,parentRule: IRule?,
                      thenAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean)?,
                      elseAction: ((currentRule: IRule, parentRule: IRule?) -> Boolean)?): Boolean {
        if(exclusive){
            for(r in children){
                if(r.eval(dataPicker,this, thenAction, elseAction)){
                    return true
                }
            }
            return false
        }else{
            for(r in children){
                r.eval(dataPicker, this,thenAction, elseAction)
            }
            return false
        }
    }
}

