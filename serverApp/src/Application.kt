package com.github.rwsbillyang.rule.composer.app



import com.github.rwsbillyang.ktorKit.db.DbType
import com.github.rwsbillyang.ktorKit.log.LogBackUtil
import com.github.rwsbillyang.ktorKit.server.AppModule
import com.github.rwsbillyang.ktorKit.server.defaultInstall
import com.github.rwsbillyang.ktorKit.server.installCORS
import com.github.rwsbillyang.ktorKit.server.installModule
import com.github.rwsbillyang.rule.composer.MySerializeJson
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.routing.*
import org.koin.dsl.module


@Suppress("unused") // Referenced in application.conf
@kotlin.jvm.JvmOverloads
fun Application.module(testing: Boolean = false) { //"X-Auth-uId", "X-Auth-oId", "X-Auth-unId","X-Auth-CorpId","Authorization"
    // java -jar  -DwithSPA=../webapp/www/ build/libs/RuleComposer-1.0.0-all.jar
    // java -jar -DwithSPA=../webapp/www/ -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/RuleComposer-1.0.0-all.jar
    // nohup java -jar -Ddev.mode=prod -DwithSPA=../webapp/www/ -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/RuleComposer-1.0.0-all.jar > log/err.txt 2>&1 &
    val dbHost = System.getProperty("dbHost") ?: "127.0.0.1"
    val dbPort = System.getProperty("dbPort")?.toInt() ?: 3306
    val dbName = System.getProperty("dbName") ?: "ruleEngineDb"
    val dbUser = System.getProperty("dbUser") ?: "root"
    val dbPwd = System.getProperty("dbPwd") ?: "123456"
    val withSPA = System.getProperty("withSPA")

    //-DdevMode=prod
    LogBackUtil.setupForConsole()
//    val isDev = (System.getProperty("dev.mode") ?: "dev") == "dev"
//    if(isDev){
//        LogBackUtil.setupForConsole()
//    }else{
//        LogBackUtil.setupForFile()
//        //LogBackUtil.setupForRollingFile()
//    }
//    log.info("==================isDev=$isDev(default: dev)==================")

    val app = this
    val mainModule = AppModule(
        listOf(module(createdAtStart = true){
            single<Application> { app }
        }),null)

    installModule(mainModule)

    //使用SQL数据库，非默认设置
    installModule(bizModule,dbName, DbType.SQL, dbUser, dbPwd, dbHost, dbPort)

    defaultInstall(enableJwt = false, enableJsonApi = false, enableWebSocket = false)

    //https://ktor.io/servers/features/content-negotiation/serialization-converter.html
    //https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/custom_serializers.md
    install(ContentNegotiation) {
        json(
            json = MySerializeJson,
            contentType = ContentType.Application.Json
        )
    }
    if(withSPA != null){
        log.info("======withSPA=$withSPA======")
        routing {
            singlePageApplication {
                react(withSPA)
            }
        }
    }else{
        log.info("======installCORS======")
        installCORS(false)
    }
    log.info("======dbHost=$dbHost======")
    log.info("======dbPort=$dbPort======")
    log.info("======dbName=$dbName======")
    log.info("======dbUser=$dbUser======")
    log.info("======dbPort=$dbPort======")
}




