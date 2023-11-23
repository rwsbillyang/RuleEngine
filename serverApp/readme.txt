Rule Engine Studio App

## Run

```
java -jar -DwithSPA=../webapp/www/ build/libs/RuleComposer-1.0.0-all.jar
java -jar -DwithSPA=../webapp/www/ -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/RuleComposer-1.0.0-all.jar
nohup java -jar -Ddev.mode=prod  -DwithSPA=../webapp/www/ -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/RuleComposer-1.0.0-all.jar > log/err.txt 2>&1 &
```
then open browser:
```
http://0.0.0.0:18000
```

## Dev
### webapp

### server App