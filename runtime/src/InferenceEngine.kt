/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-07-10 15:57
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


abstract class InferenceEngine<INPUT_DATA, OUTPUT_RESULT> {
//
//    private val ruleParser: RuleParser<INPUT_DATA, OUTPUT_RESULT>? = null
//    fun run(
//        listOfRules: List<Rule>,
//        inputData: INPUT_DATA
//    ): OUTPUT_RESULT? {
//        //STEP 1 MATCH
//        val conflictSet =
//            match(listOfRules, inputData)
//        //STEP 2 RESOLVE
//        val resolvedRule = resolve(conflictSet) ?: return null
//        //STEP 3 EXECUTE
//        return executeRule(resolvedRule, inputData)
//    }
//
//    //Here we are using Linear matching algorithm for pattern
//    protected fun match(listOfRules: List<Rule>, inputData: INPUT_DATA): List<Rule> {
//        return listOfRules.stream()
//            .filter { rule: Rule ->
//                val condition = rule.condition
//                ruleParser.parseCondition(condition, inputData)
//            }
//            .collect(Collectors.toList())
//    }
//
//    //Here we are using find first rule logic.
//    protected fun resolve(conflictSet: List<Rule>): Rule? {
//        val rule: Rule? = conflictSet.stream()
//            .findFirst()
//        return if (rule.isPresent()) {
//            rule.get()
//        } else null
//    }
//
//    protected fun executeRule(rule: Rule, inputData: INPUT_DATA): OUTPUT_RESULT {
//        val outputResult = initializeOutputResult()
//        return ruleParser.parseAction(rule.action, inputData, outputResult)
//    }
//
//    protected abstract fun initializeOutputResult(): OUTPUT_RESULT
//    protected abstract val ruleNamespace: RuleNamespace?
}