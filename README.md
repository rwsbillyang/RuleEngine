
## serverApp
cd ./serverApp
./gradlew run

Only first time: insert system initial data into database:
http://localhost:18000/api/rule/engine/initDb



## webapp

npm create vite webapp

cd webapp

npm i react-router-dom --save
npm i antd --save
npm i @rwsbillyang/usecache --save
npm i use-bus --save
npm i --save dayjs @formily/core @formily/react @formily/antd-v5   //https://antd5.formilyjs.org/zh-CN

npm i @ant-design/pro-table  @ant-design/pro-form @ant-design/pro-layout

npm i tslib
//npm i md5 --save
//npm i --save-dev @types/md5
