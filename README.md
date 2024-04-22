
# 1. Rule Engine

Rule Engine project contains RuleComposer and Rule Runtime which supports decision tree.



# 2. Rule Composer
Rule composer is based on C/S architecture.

In it, you can create rule and rule group, and rule/ruleGroup tree.


The client is based on [react](https://react.dev/) + [antd pro](https://pro.ant.design/), inlcuding  [easy-antd-pro](https://github.com/rwsbillyang/easyAntdPro) and [usecache](https://github.com/rwsbillyang/usecache).

The server is based on [Ktor](https://ktor.io/) + MySQL, inlcuding [ktorKit](https://github.com/rwsbillyang/ktorKit) 



## 2.1. Run Guide

- Step1: prepare initial data
Frist time, before run, we should import initial data into database.


- Step2: run backend server

Run RuleComposer with default database settings
```
java -jar -DwithSPA=../webapp/www/ build/libs/rule-composer-serverApp-1.0.0-all.jar
```

Run RuleComposer with specified database settings
```
java -jar -DwithSPA=../webapp/www/ -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/rule-composer-serverApp-1.0.0-all.jar
```

Run RuleComposer as daemon with specified database settings
```
nohup java -jar -DwithSPA=../webapp/www/ -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/rule-composer-serverApp-1.0.0-all.jar > log/err.txt 2>&1 &
```

- Step3: Open `http://localhost:8000` in browser


# 3. Rule Runtime
## 3.1. Features
- Supprt DataType:
    - Bool
    - String/String
    - Int/Long/Double and theit Set
    - DateTime/DateTimeSet

- Support  Operations:
    - eq, ne, gt, gte, it, lte
    - between, not btween, in, nin
    - onlyContains, contains, notContains, containsAll
    - anyIn, numberIn, gteNumberIn, allIn, allNotIn
    - or, and, none

- support extension of DataType and Operation 

## 3.2. Cutomize Extension

In your rule runtime extension library, define expression and SerializersModule.

Step1: define XXXExpr
```kotlin
enum class XXOpEnum(
    override val label: String,
    override val remark: String?,
    override val operandCfgMap: Map<String, OperandConfig>): IExtOpEnum
{

    op1("op1", "op1 tip info", mapOf(
        "operand1" to OperandConfig("operand1", "operand1 tip info", true, true, typeCode = IType.Type_StringSet
        ),
        "operand2" to OperandConfig("operand2", "operand1 tip info", true, true, typeCode = IType.Type_StringSet) 
    ))
}

@Serializable
@SerialName(XXXType.classDiscriminator)
class XXXExpr(
    override val key: String,
    override val op: String,
    override val operands: Map<String, Operand>,
    val extra: String? = null
): ITriLogicalExpr {
    override fun eval(dataProvider: (key: String, keyExtra:String?) -> Any?) =
        XXXType.op(dataProvider, key, op, operands, extra)
}


object XXXType: BaseType<String>() {
    const val classDiscriminator = "XXX"
    override val code = classDiscriminator 
    override val label = "XXX label" 

    override fun supportOperators() = XXXOpEnum.entries.map { it.name }
    override fun op(dataProvider: (key: String, keyExtra:String?) -> Any?, key: String, op: String, operands: Map<String, Operand>, keyExtra: String?): Boolean
    {
        return when(XXXOpEnum.valueOf(op)) {
            XXXOpEnum.op1 ->{
                val operand1 = operands["operand1"]?.raw(dataProvider) as Set<String>?
                if (operand1.isNullOrEmpty()) throw Exception("XXXType: ${op}: no operand1")

                val operand2 = operands["operand2"]?.raw(dataProvider) as Set<String>?
                if (operand2.isNullOrEmpty()) throw Exception("XXXType: ${op}: no operand2")

                //here do your op1 and return true or false
                //...
            }
        }
    }
}
```


Step2: add SerializersModule
```kotlin
val xxSerializersModule = SerializersModule {
    polymorphic(ILogicalExpr::class){
        subclass(XXXExpr::class)
    }
}
```




# 4. Run Rule evaluation
Create your project, and in it provides data and run rule evaluation, and excute some jobs if hit rule.

In your project: 

## 4.1. add dependency

add rule runtime depedency as following:


Modifiy settings.gradle:
```gradle
dependencyResolutionManagement {
    //...

    // use version catalog
    versionCatalogs {
        libs {
            //from(files("../../libs.versions.toml"))
            from("com.github.rwsbillyang:version-catalog:1.0.0")
        }
    }
}
```



add dependcy in build.gradle likes the following:
```gradle
dependencies {
    implementation libs.rule.runtime

}
```

If cusomize rule runtime extension, register SerializersModule in your project:
```kotlin
val MySerializeJson = Json {
    //apiJsonBuilder()
    ruleRuntimeExprSerializersModule + xxSerializersModule
}
```

## 4.2. Providing data


Providing data for rule evaluation, demo code:
```kotlin
    val dataProvider: (key: String, keyExtra: String?) -> Any? = {key, keyExtra->
        when(key){
            "gender" -> YourData.gender.ordinal
            "x" -> 0
            //...
            else -> {
                System.err.println("dataProvider: key=$key, keyExtra=$keyExtra, return key")
                null
            }
        }
```

## 4.3. Loading children rules
RuleEngine does not load all rules. Only load children rules or ruleGroup when parent rule hits.
```kotlin
    val loadChildrenFunc: (parent: Any?) -> List<Any>? = {
        if(it == null) null
        else when (it) {
            is Rule -> {
                val list = mutableListOf<Any>()
                if(it.ruleChildrenIds != null){
                    val list1 = service.findAll(Meta.rule, { Meta.rule.id inList it.ruleChildrenIds.split(",").map{it.toInt()} })
                    list.addAll(list1)
                    //println("load Rule children size=${list1.size} for Rule=${it.label},id=${it.id}")
                }

                if(it.ruleGroupChildrenIds != null){
                    val list2 = service.findAll(Meta.ruleGroup, { Meta.ruleGroup.id inList it.ruleGroupChildrenIds.split(",").map{it.toInt()} })
                    list.addAll(list2)
                    //println("load RuleGroup children size=${list2.size} for Rule=${it.label},id=${it.id}")
                }

                list
            }

            is RuleGroup -> {
                val list = mutableListOf<Any>()
                if(it.ruleChildrenIds != null){
                    val list1 = service.findAll(Meta.rule, {Meta.rule.id inList it.ruleChildrenIds.split(",").map{it.toInt()} })
                    list.addAll(list1)
                    //println("load Rule children size=${list1.size} for RuleGroup=${it.label},id=${it.id}")
                }

                if(it.ruleGroupChildrenIds != null){
                    val list2 = service.findAll(Meta.ruleGroup, {Meta.ruleGroup.id inList it.ruleGroupChildrenIds.split(",").map{it.toInt()} })
                    list.addAll(list2)
                    //println("load RuleGroup children size=${list2.size} for RuleGroup=${it.label},id=${it.id}")
                }

                list
            }

            else -> {
                System.err.println("loadChildrenFunc: extra is not Rule or RuleGroup")
                null
            }
        }
    }
```


## 4.4. toEvalRule

In rule runtime, all rules evaluation is finished by LogicalEvalRule, so you should convert the rule data in database into LogicalEvalRule for evaluation.

```kotlin
    val toEvalRule: (extra: Any) -> LogicalEvalRule<MyData> = {
        when (it) {
            is Rule ->{
                val rule = it
                try {
                    LogicalEvalRule(it.getExpr(), it.exclusive == 1,dataProvider, loadChildrenFunc, collector, it, false)//{ "${rule.id}: ${rule.description}"}
                }catch (e: Exception){
                    println("Exception=${e.message}, it.id=${it.id}")
                    throw e
                }
            }
            is RuleGroup -> {
                val group = it
                LogicalEvalRule(it.getExpr()?:TrueExpression, it.exclusive == 1,dataProvider, loadChildrenFunc, collector, it, true)//{ "group-${group.id}: ${group.label}"}
            }
            else -> {
                System.err.println("toEvalRule: only support Rule/RuleGroup as extra for EvalRule： ${it.toString()}")
                throw Exception("only support Rule/RuleGroup as extra")
            }
        }
    }
```
if need to do action or elseAction,  passed them LogicalEvalRule

```kotlin
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
)
```


## 4.5. Result Collector

After evaluation, the results are collected by ResultTreeCollector, and keep the tree structure same as rules and ruleGroups tree.

```kotlin
    val collector = ResultTreeCollector{
        val ruleCommon = extra2RuleCommon(it.entity, service)
        val key = ruleCommon?.typedId?:"?" //if (ruleCommon?.rule != null) "rule-${ruleCommon.id}" else if(ruleCommon?.ruleGroup != null) "group-${ruleCommon.id}" else "?"
        val data = MyData(key, ruleCommon?.id, ruleCommon?.label,
            ruleCommon?.description, ruleCommon?.rule?.remark, ruleCommon?.rule?.exprRemark)
        println("collect $key: ${ruleCommon?.label}")
        Pair(key, data)
    }
```

The node type in result tree is customized, here is MyData:
```kotlin
class MyData(val key:String, val id: Int?, val label: String?, val desc: String?, val remark: String?, val exprRemark: String?)
```

## 4.6. Eval rule


```kotlin
val rootList = service.findAll(Meta.ruleGroup, {Meta.ruleGroup.label eq "xx"})
RuleEngine<MyData>().eval(rootList, toEvalRule)
```


## 4.7. Traversion of rule result

```kotlin
val sb = StringBuilder()
    //println收集的结果
    println("traverseResult: ${collector.resultMap.size}, root.children.size=${collector.root.children.size}")
    collector.traverseResult{
        val msg = "${it.data?.key}. ${it.data?.label}, desc=${it.data?.desc}\n"
        sb.append(msg)
        println(msg)
    }
```

# 5. Build from src

## 5.1. serverApp

```
cd ./serverLib
gradle publishToMavenLocal

cd ./serverApp
gradle run
```

build: `gradle build` in serverApp

## 5.2. webapp

cd ./webapp

run:  `npm run dev`

build: `npm run build`


### 5.2.1. from scratch

npm create vite webapp

cd webapp

npm i react-router-dom --save
npm i antd --save
npm i @rwsbillyang/usecache --save
npm i use-bus --save

npm i --save dayjs
//npm i --save @formily/core @formily/react @formily/antd-v5   //https://antd5.formilyjs.org/zh-CN

npm i --save @ant-design/pro-table  @ant-design/pro-form @ant-design/pro-layout @ant-design/pro-provider
//npm install --save  @ant-design/pro-form @ant-design/pro-layout @ant-design/pro-provider @ant-design/pro-table antd

npm i tslib
npm i md5 --save
npm i --save-dev @types/md5