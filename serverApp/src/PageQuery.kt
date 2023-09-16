/*
 * Copyright © 2023 rwsbillyang@qq.com
 *
 * Written by rwsbillyang@qq.com at Beijing Time: 2023-08-25 22:51
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

package com.github.rwsbillyang.rule.composer

import com.github.rwsbillyang.ktorKit.apiBox.IUmiPaginationParams
import com.github.rwsbillyang.ktorKit.apiBox.Sort
import com.github.rwsbillyang.ktorKit.db.SqlPagination
import com.github.rwsbillyang.ruleEngine.core.expression.OpType
import io.ktor.resources.*
import kotlinx.serialization.Serializable
import org.komapper.core.dsl.Meta
import org.komapper.core.dsl.expression.SortExpression
import org.komapper.core.dsl.expression.WhereDeclaration
import org.komapper.core.dsl.operator.asc
import org.komapper.core.dsl.operator.desc
import org.komapper.core.dsl.operator.or


@Resource("/param")
@Serializable
class ParameterQueryParams(
    override val umi: String? = null,
    val label: String? = null,
    val typeId: Int? = null,
    val mapKey: String? = null,
    val domainId: Int? = null,
    val categoryId: Int? = null
) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.param
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.id
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }

        val w1: WhereDeclaration? = if (label != null) {
            { meta.label like "%${label}%" }
        } else null
        val w2: WhereDeclaration? = typeId?.let { { meta.typeId eq it } }
        val w3: WhereDeclaration? = mapKey?.let { { meta.mapKey like "%${it}%" } }
        val w4: WhereDeclaration? = domainId?.let { { meta.domainId eq it } }
        val w5: WhereDeclaration? = categoryId?.let { { meta.categoryId eq it } }
        //pageSize为-1时表示该查询条件下的全部数据
        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w1, w2, w3, w4, w5, lastW)
    }
}


@Resource("/paramCategory")
@Serializable
class ParamCategoryQueryParams(
    override val umi: String? = null,
    val label: String? = null,
    val domainId: Int? = null,
    val typeId: Int? = null,//非空表示只需要该类型下的树
    val setupChildren: Boolean = false //在通过分类选择变量时设置为true
) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.paramCategory
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.id
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }

        val w1: WhereDeclaration? = if (label != null) {
            { meta.label like "%${label}%" }
        } else null

        val w4: WhereDeclaration? = domainId?.let { { meta.domainId eq it } }
        //pageSize为-1时表示该查询条件下的全部数据
        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w1, w4, lastW)
    }
}

@Resource("/paramType") //  /parameter/list
@Serializable
class ParameterTypeQueryParams(
    override val umi: String? = null,
    val label: String? = null,
    val isSys: Boolean? = null,
    val isBasic: Boolean? = null
) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.paramType
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.id
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }

        val w1: WhereDeclaration? = if (label != null) {
            { meta.label like "%${label}%" }
        } else null
        val w2: WhereDeclaration? = isSys?.let { { meta.isSys eq it } }
        val w3: WhereDeclaration? = isBasic?.let { { meta.isBasic eq it } }

        //pageSize为-1时表示该查询条件下的全部数据
        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w1, w2, w3, lastW)
    }
}


@Resource("/constant")
@Serializable
class ValueConstantQueryParams(
    override val umi: String? = null,
    val label: String? = null,
    val isEnum: Boolean? = null,
    val domainId: Int? = null,
    val typeIds: String? = null,
    val ids: String? = null

) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.constant
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.id
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }
        val w1: WhereDeclaration? = if (label != null) {
            { meta.label like "%${label}%" }
        } else null
        val w2: WhereDeclaration? = typeIds?.let { { meta.typeId inList it.split(",").map { it.toInt() } } }
        val w3: WhereDeclaration? = if(domainId == null) null else {
            val self: WhereDeclaration = { meta.domainId eq domainId }
            val defaultAll: WhereDeclaration =  { meta.domainId.isNull() } //若指定了domainId，也包括那些没指定的domainId的常量
            self.or(defaultAll)
        }
        val w4: WhereDeclaration? = isEnum?.let { { meta.isEnum eq it } }
        val w5: WhereDeclaration? = ids?.let { { meta.id inList it.split(",").map { it.toInt() } } }
        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w5, w2, w3, w4, w1, lastW)
    }
}


@Resource("/operator")
@Serializable
class OperatorQueryParams(
    override val umi: String? = null,
    val label: String? = null,
    val isSys: Boolean? = null,
    val type: OpType? = null,
    val ids: String? = null //,分隔的id， 即根据operator.id列表查询
) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.operator
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.id
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }

        val w1: WhereDeclaration? = if (label != null) {
            { meta.label like "%${label}%" }
        } else null
        val w2: WhereDeclaration? = isSys?.let { { meta.isSys eq it } }
        val w3: WhereDeclaration? = ids?.let { { meta.id inList it.split(",").map { it.toInt() } } }
        val w4: WhereDeclaration? = type?.let{ { meta.type eq it}}
        //pageSize为-1时表示该查询条件下的全部数据
        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w3, w1, w2, w4, lastW)
    }
}


@Resource("/expression")
@Serializable
class ExpressionQueryParams(
    override val umi: String? = null,
    val label: String? = null,
    val type: String? = null, //basic or complex
    val domainId: Int? = null
) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.expression
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.id
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }
        val w1: WhereDeclaration? = if (label != null) {
            { meta.label like "%${label}%" }
        } else null
        val w2: WhereDeclaration? = type?.let { { meta.type eq it } }
        val w3: WhereDeclaration? = domainId?.let { { meta.domainId eq it } }

        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w1, w2, w3, lastW)
    }
}


@Resource("/domain")
@Serializable
class DomainQueryParams(
    override val umi: String? = null,
    val label: String? = null,

    ) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.domain
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.id
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }

        val w1: WhereDeclaration? = if (label != null) {
            { meta.label like "%${label}%" }
        } else null
        //pageSize为-1时表示该查询条件下的全部数据
        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w1, lastW)
    }

}

@Resource("/rule")
@Serializable
class RuleQueryParams(
    override val umi: String? = null,
    val label: String? = null,
    val domainId: Int? = null,
    val enable: Boolean? = null,
    val tags: String? = null,
    val level: Int? = null,
    val threshhold: Int? = null
) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.rule
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.priority
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }

        val w1: WhereDeclaration? = if (label != null) {
            { meta.label like "%${label}%" }
        } else null
        val w2: WhereDeclaration? = domainId?.let { { meta.domainId eq it } }
        val w3: WhereDeclaration? = enable?.let { { meta.enable eq it } }
        val w4: WhereDeclaration? = if (tags != null) {
            { meta.tags like "%${tags}%" }
        } else null
        val w5: WhereDeclaration? = threshhold?.let { { meta.threshhold greaterEq threshhold } }
        val w6: WhereDeclaration? = level?.let { { meta.level eq it } }
        //pageSize为-1时表示该查询条件下的全部数据
        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w1, w2, w6,w3, w4, w5, lastW)
    }

}

@Resource("/ruleGroup")
@Serializable
class RuleGroupQueryParams(
    override val umi: String? = null,
    val label: String? = null,
    val domainId: Int? = null,
    val enable: Boolean? = null,
    val level: Int? = null
) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.ruleGroup
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.priority
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }

        val w1: WhereDeclaration? = if (label != null) {
            { meta.label like "%${label}%" }
        } else null
        val w2: WhereDeclaration? = domainId?.let { { meta.domainId eq it } }
        val w3: WhereDeclaration? = enable?.let { { meta.enable eq it } }
        val w6: WhereDeclaration? = level?.let { { meta.level eq it } }
        //pageSize为-1时表示该查询条件下的全部数据
        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w1, w2, w6, w3, lastW)
    }
}


@Resource("/action")
@Serializable
class ActionQueryParams(
    override val umi: String? = null,
    val actionKey: String? = null,

    ) : IUmiPaginationParams {
    override fun toSqlPagination(): SqlPagination {
        val meta = Meta.ruleAction
        val lastId = pagination.lastId
        var lastW: WhereDeclaration? = null
        val sort: SortExpression

        //一般是根据pagination.sKey进行排序，但此处总是根据id进行排序
        val sortKey = meta.id
        sort = if (pagination.sort == Sort.DESC) sortKey.desc() else sortKey.asc()
        if (lastId != null) {
            val lastT = lastId.toInt()
            lastW = if (pagination.sort == Sort.DESC) {
                { sortKey less lastT }
            } else {
                { sortKey greater lastT }
            }
        }

        val w1: WhereDeclaration? = if (actionKey != null) {
            { meta.actionKey eq actionKey }
        } else null
        //pageSize为-1时表示该查询条件下的全部数据
        return SqlPagination(sort, pagination.pageSize, (pagination.current - 1) * pagination.pageSize)
            .addWhere(w1, lastW)
    }

}