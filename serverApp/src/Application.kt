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
import io.ktor.server.plugins.contentnegotiation.*
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
    val isDev = (System.getProperty("dev.mode") ?: "dev") == "dev"

    log.info("==================isDev=$isDev(default: dev)==================")


    val app = this
    val mainModule = AppModule(
        listOf(module(createdAtStart = true){
            //single<AbstractJwtHelper> { MyJwtHelper() } //MyJwtHelper
            single<Application> { app }
        }),null)

    installModule(mainModule)

    //为减少后端启动的java app数量，将各程序的业务模块集中到一个app中，在nginx配置中都使用同一个upstream即可
    //需要放到一起的话，就引入对应的依赖，install对应的业务模块，这款模块依然可以放入到不同的数据库中，互不干扰
    //前端可以采用分离的webapp（对应不同不同的域名），需在nginx中配置对应的virtual host
    //前端也可以集成到一起，放到一个webapp中，各应用（如公众号或企业微信agent应用），使用该webapp对应的域名下不同的路径即可
    installModule(bizModule,"ruleEngineDb", DbType.SQL, "root", "123456", "127.0.0.1", 3306)

    defaultInstall(enableJwt = false, false, enableWebSocket = false)

    //https://ktor.io/servers/features/content-negotiation/serialization-converter.html
    //https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/custom_serializers.md
    install(ContentNegotiation) {
        json(
            json = MySerializeJson,
            contentType = ContentType.Application.Json
        )
    }

    installCORS(false)
}




