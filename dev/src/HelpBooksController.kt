/*
 * ```
 * Copyright © 2024 rwsbillyang@qq.com.  All Rights Reserved.
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2024-04-22 14:51
 *
 * NOTICE:
 * This software is protected by China and U.S. Copyright Law and International Treaties.
 * Unauthorized use, duplication, reverse engineering, any form of redistribution,
 * or use in part or in whole other than by prior, express, printed and signed license
 * for use is subject to civil and criminal prosecution. If you have received this file in error,
 * please notify copyright holder and destroy this and any other copies as instructed.
 * ```
 */

package com.github.rwsbillyang.rule.composer.dev

import com.github.rwsbillyang.ktorKit.apiBox.Sort
import com.github.rwsbillyang.ktorKit.apiBox.UmiPagination
import com.github.rwsbillyang.ktorKit.db.AbstractSqlService
import com.github.rwsbillyang.ktorKit.db.SqlLiteHelper
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import org.komapper.core.dsl.Meta

import com.github.rwsbillyang.rule.composer.*
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

/**
 * MingLi helpbooks 更新后，提交更新后，将数据写入sqllite：
 * /Users/bill/git/MingLi/app/src/main/assets/app.db
 * */
class HelpBooksController: KoinComponent  {
    companion object{
        const val sqliteDb = "/Users/bill/git/android/MingLi/app/src/main/assets/app.db"
        //const val sqliteDb = "/Users/bill/Downloads/app.db"
    }
    val service: BaseCrudService by inject()

    val sqlLiteHelper = SqlLiteHelper(sqliteDb)

    fun updateJuniorBookStar(list: List<JuniorBookStar>){
        list.forEach {
            sqlLiteHelper.updateById("JuniorBookStar", it.id, it.toMap())
        }
    }
    fun updateSeniorBookStar(list: List<SeniorBookStar>){
        list.forEach {
            sqlLiteHelper.updateById("SeniorBookStar", it.id, it.toMap())
        }
    }
    fun updateSixtyStarSerials(list: List<SixtyStarSerials>){
        list.forEach {
            sqlLiteHelper.updateById("SixtyStarSerials", it.id, it.toMap())
        }
    }
    fun updateJuniorBookGongYuan(list: List<JuniorBookGongYuan>){
        list.forEach {
            sqlLiteHelper.updateById("JuniorBookGongYuan", it.id, it.toMap())
        }
    }
    fun updateSeniorBookGongYuan(list: List<SeniorBookGongYuan>){
        list.forEach {
            sqlLiteHelper.updateById("SeniorBookGongYuan", it.id, it.toMap())
        }
    }
    fun updateMiscBookGongYuan(list: List<MiscBookGongYuan>){
        list.forEach {
            sqlLiteHelper.updateById("MiscBookGongYuan", it.id, it.toMap())
        }
    }
    fun updateLbzRemark(list: List<LbzRemark>){
        list.forEach {
            sqlLiteHelper.updateById("LbzRemark", it.id, it.toMap())
        }
    }

    fun updateBirthInfo(list: List<BirthInfo>){
        list.forEach {
            //maybe update
            sqlLiteHelper.insert("BirthInfo", it.toMap())
        }
    }

    fun getBirthInfoLastId(): Int{
        val resultSet = sqlLiteHelper.find("select * from BirthInfo ORDER BY id DESC LIMIT 1")

        if (resultSet.next()) {
            return resultSet.getInt("id")
        }else{
            println("not found records in BirthInfo?")
            return 0
        }
    }

    fun getRulePage(lastId: String?, pageSize: Int, domainId: Int): List<Rule>{
        val p = RuleQueryParams(MySerializeJson.encodeToString(UmiPagination(sort = Sort.ASC, pageSize = pageSize, lastId = lastId)), enable= 1, domainId = domainId)
        return service.findPage(Meta.rule, p.toSqlPagination())
    }
    fun getRuleGroupPage(lastId: String?,  pageSize: Int,  domainId: Int): List<RuleGroup>{
        val p = RuleGroupQueryParams(MySerializeJson.encodeToString(UmiPagination(sort = Sort.ASC, pageSize = pageSize, lastId = lastId)),  enable= 1, domainId = domainId)
        return service.findPage(Meta.ruleGroup, p.toSqlPagination())
    }
}


/**
 * 王亭之-中州派紫微斗数 初级讲义
 * */
@Serializable
class JuniorBookStar(
    val id: Int,
    val star: String,
    val category: String,
    val looks: String?, //; appearance ; bearing: String,
    val remark: String?, //备注说明
    val likes: String?, //喜忌
    val sick: String?, //疾病
    val character: String?,//性质 from 陈雪涛 紫微讲义
    val layout: String? //安星法
){
    fun toMap() = mapOf("looks" to looks, "character" to character, "remark" to remark, "likes" to likes, "sick" to sick, "layout" to layout)
}
/**
 * 王亭之-中州派紫微斗数 深造讲义
 * */
@Serializable
class SeniorBookStar(
    val id: Int,
    val star: String,
    val category: String,
    val description: String,
    val fromStar: String?, //四化
    val brief: String? = null // from陈雪涛 紫微讲义
){
    fun toMap() = mapOf("description" to description, "brief" to brief)
}

/**
 * 王亭之-中州派紫微斗数 深造讲义 60星系
 * */
@Serializable
class SixtyStarSerials(
    val id: Int,
    val stars: String,
    val pos: String,
    val description: String
){
    fun toMap() = mapOf("description" to description)
}
/**
 * 王亭之-中州派紫微斗数 初级讲义
 * */
@Serializable
class JuniorBookGongYuan(
    val id: Int,
    val gongyuan: String,
    val star: String,
    val description: String
){
    fun toMap() = mapOf("description" to description)
}



/**
 * 王亭之-中州派紫微斗数 深造讲义
 * */
@Serializable
class SeniorBookGongYuan(
    val id: Int,
    val gongyuan: String,
    val star: String,
    val description: String
){
    fun toMap() = mapOf("description" to description)
}

@Serializable
class MiscBookGongYuan(
    val id: Int,
    val gongyuan: String,
    val star: String,
    val description: String,
    val pos: String? = null //紫微位置|宫支,eg: 子|未
) {
    fun toMap() = mapOf("description" to description)
}
/**
 * 陆斌兆紫微斗数评注
 * @param id
 * @param star 所查14正曜
 * @param origin 原注
 * @param remark 评注
 * @param gongyuan 所在宫垣
 * */
@Serializable
class LbzRemark(
    val id: Int,
    val star: String,
    val origin: String,
    val remark: String,
    val gongyuan: String?
){
    fun toMap() = mapOf("origin" to origin, "remark" to remark)
}

@Serializable
class BirthInfo(
    val id: Int,
    val gender: String,
    val calendar: String,
    val year: Int,
    val month: Int, //[1,12]
    val day: Int, //[1, 31]
    val hour: Int,
    val minute: Int,
    //@ColumnInfo(name = "is_leap")
    val isLeap: Int = 0,//ChineseCalendar 农历是否闰月
    //@ColumnInfo(name = "province_id")
    val provinceId: Int? = null,
    //@ColumnInfo(name = "city_id")
    val cityId: Int? = null,
    //@ColumnInfo(name = "district_id")
    val districtId: Int? = null,
    val name: String? = null,
    val remark: String? = null
){
    fun toMap() = mapOf("id" to id, "gender" to gender, "calendar" to calendar, "year" to year, "month" to month, "day" to day, "hour" to hour,"minute" to minute,
    "is_leap" to isLeap, "province_id" to provinceId, "city_id" to cityId, "district_id" to districtId, "name" to name, "remark" to remark)
}