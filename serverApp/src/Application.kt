package com.github.rwsbillyang.rule.composer



import com.github.rwsbillyang.ktorKit.ApiJson.apiJsonBuilder
import com.github.rwsbillyang.ktorKit.LocalDateTimeAsStringSerializer
import com.github.rwsbillyang.ktorKit.db.DbType
import com.github.rwsbillyang.ktorKit.server.AppModule
import com.github.rwsbillyang.ktorKit.server.defaultInstall
import com.github.rwsbillyang.ktorKit.server.installCORS
import com.github.rwsbillyang.ktorKit.server.installModule
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*


import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import kotlinx.serialization.modules.contextual


import org.koin.dsl.module

//默认情况下enableJsonApi为true，使用的是LocalDateTimeAsLongSerializer and ObjectId64Serializer
val MySerializeJson = Json {
    apiJsonBuilder()
    serializersModule = SerializersModule {
        contextual(LocalDateTimeAsStringSerializer) //默认情况下enableJsonApi为true，使用的是LocalDateTimeAsLongSerializer and ObjectId64Serializer
    }
}

@Suppress("unused") // Referenced in application.conf
@kotlin.jvm.JvmOverloads
fun Application.module(testing: Boolean = false) { //"X-Auth-uId", "X-Auth-oId", "X-Auth-unId","X-Auth-CorpId","Authorization"
    // java -jar build/libs/RuleComposer-1.0.0-all.jar
    // java -jar -DwithSPA=../webapp/www/ -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/RuleComposer-1.0.0-all.jar
    // nohup java -jar -DwithSPA=../webapp/www/ -DdbHost=127.0.0.1 -DdbPort=3306 -DdbName=ruleEngineDb -DdbUser=root -DdbPwd=123456 -DdbHost=127 build/libs/RuleComposer-1.0.0-all.jar > log/err.txt 2>&1 &
    val dbHost = System.getProperty("dbHost") ?: "127.0.0.1"
    val dbPort = System.getProperty("dbPort")?.toInt() ?: 3306
    val dbName = System.getProperty("dbName") ?: "ruleEngineDb"
    val dbUser = System.getProperty("dbUser") ?: "root"
    val dbPwd = System.getProperty("dbPwd") ?: "123456"
    val withSPA = System.getProperty("withSPA")

    log.info("======dbHost=$dbHost======")
    log.info("======dbPort=$dbPort======")
    log.info("======dbName=$dbName======")
    log.info("======dbUser=$dbUser======")
    log.info("======dbPort=$dbPort======")

    val app = this
    val mainModule = AppModule(
        listOf(module(createdAtStart = true){
            single<Application> { app }
        }),null)

    installModule(mainModule)

    //为减少后端启动的java app数量，将各程序的业务模块集中到一个app中，在nginx配置中都使用同一个upstream即可
    //需要放到一起的话，就引入对应的依赖，install对应的业务模块，这款模块依然可以放入到不同的数据库中，互不干扰
    //前端可以采用分离的webapp（对应不同不同的域名），需在nginx中配置对应的virtual host
    //前端也可以集成到一起，放到一个webapp中，各应用（如公众号或企业微信agent应用），使用该webapp对应的域名下不同的路径即可

    installModule(bizModule,dbName, DbType.SQL, dbUser, dbPwd, dbHost, dbPort)

    defaultInstall(enableJwt = false, false, enableWebSocket = false)

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
}




