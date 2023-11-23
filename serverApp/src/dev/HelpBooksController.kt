/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-11-21 15:28
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

package com.github.rwsbillyang.rule.composer.dev

import com.github.rwsbillyang.ktorKit.apiBox.Sort
import com.github.rwsbillyang.ktorKit.apiBox.UmiPagination
import com.github.rwsbillyang.ktorKit.db.AbstractSqlService
import com.github.rwsbillyang.ktorKit.db.SqlLiteHelper
import com.github.rwsbillyang.rule.composer.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import org.komapper.core.dsl.Meta

/**
 * MingLi helpbooks 更新后，提交更新后，将数据写入sqllite：
 * /Users/bill/git/MingLi/app/src/main/assets/app.db
 * */
class HelpBooksController(val service: AbstractSqlService)  {
    //val db = "/Users/bill/git/MingLi/app/src/main/assets/app.db"
    val db = "/Users/bill/Downloads/app.db"
    val sqlLiteHelper = SqlLiteHelper(db)

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
    val character: String?,// 性格
    val remark: String?, //备注说明
    val likes: String?, //喜忌
    val sick: String? //疾病
){
    fun toMap() = mapOf("looks" to looks, "character" to character, "remark" to remark, "likes" to likes, "sick" to sick)
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
    val fromStar: String? //四化
){
    fun toMap() = mapOf("description" to description)
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