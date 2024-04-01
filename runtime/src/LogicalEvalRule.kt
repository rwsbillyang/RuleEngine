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
 * @param logicalExpr 表达式
 * @param exclusive 子节点是否互斥
 * @param dataProvider 根据key得到对应的变量值
 * @param loadChildrenFunc 加载序列化或数据库记录中的子规则节点entity，通常是根据子节点id列表查询
 * @param collector 提供的话则收集匹配的规则，并将结果转换为T类型
 * @param entity 附属信息，通常是对应的规则或规则组 不同环境中数据库规则实体定义可能不同
 * @param isGroup 是否是规则组
 * @param action logicalExpr执行结果为true时的动作
 * @param elseAction logicalExpr执行结果为false时的动作
 * @param logInfo 提供的话则将entity规则转换为String，用于log输出
 * */
class LogicalEvalRule<T>(
    val logicalExpr: ILogicalExpr,
    val exclusive: Boolean,
    val dataProvider: (key: String, keyExtra:String?) -> Any?,
    val loadChildrenFunc: (parent: Any?) -> List<Any>?,
    val collector: ResultTreeCollector<T>?,
    val entity: Any?,
    val isGroup: Boolean = false,
    val action: Action<T>? = null,
    val elseAction: Action<T>? = null,
    val logInfo: ((Any?) -> String?)? = null
){
    /**
     * @param toEvalRule 将序列化或数据库记录中的子规则节点entity转换为EvalRule
     * @param parentRule 当前规则的父规则，用于构建命中信息的树状结构
     * */
    fun eval(toEvalRule: (extra: Any) -> LogicalEvalRule<T>, parentRule: LogicalEvalRule<T>?): Boolean {
        try {
            val ret = logicalExpr.eval(dataProvider)
            if(logInfo != null){
                println("eval: ret=$ret, entity=${logInfo.invoke(entity)}")
            }

            if(ret){
                if(isGroup){
                    if(evalChildren(toEvalRule)){
                        collector?.collect(this, parentRule)
                        return true
                    }else{
                        return false
                    }
                }else{
                    collector?.collect(this, parentRule)
                    action?.let { it(this, parentRule) }

                    evalChildren(toEvalRule)
                    return true
                }
            }else{
                if(!isGroup){
                    elseAction?.let { it(this, parentRule) }
                }
                return false
            }

        }catch (e: Exception){
            System.err.println(e.message + "entity=" + entity)
            return false
        }
    }
    private fun evalChildren(toEvalRule: (extra: Any) -> LogicalEvalRule<T>,): Boolean
    {
        val children = loadChildrenFunc(entity)?.map{ toEvalRule(it) }
        if(children.isNullOrEmpty()){
            // println("no loadChildrenFunc, do nothing")
            return false
        }

        if(exclusive){
            //println("evalChildren: exclusively eval")
            for(r in children){
                if(r.eval(toEvalRule,this)){
                    return true
                }
            }
            return false
        }else{
            var flag = false
            for(r in children){
                val ret = r.eval(toEvalRule,this)
                if(logInfo != null){
                    println("evalChildren: ret=$ret, entity=${logInfo.invoke(entity)}")
                }
                flag = ret || flag
            }
            return flag
        }
    }
}

