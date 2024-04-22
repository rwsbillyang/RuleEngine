Run RuleComposer with default database settings
```
java -jar build/libs/rule-composer-dev-1.0.0-all.jar
```

Run RuleComposer with specified database settings
```
java -jar -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/rule-composer-dev-1.0.0-all.jar
```

Run RuleComposer as daemon with specified database settings
```
nohup java -jar -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/rule-composer-dev-1.0.0-all.jar > log/err.txt 2>&1 &

