import React, { useEffect, useRef } from 'react';
import { PlusOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import ProTable, { ProColumns, ProTableProps } from '@ant-design/pro-table';
import { Cache, BasePageQuery, StorageType, CacheStorage, useCacheList, BaseRecord, UseCacheConfig, cachedFetch, cachedFetchPromise, ArrayUtil, TreeCache } from '@rwsbillyang/usecache';
import { EditProps, MyProTableProps } from './MyProTableProps';
import { MyProConfig } from './MyProConfig';

import { LoadMore } from './LoadMore';
import { BetaSchemaForm, ProFormInstance } from '@ant-design/pro-form';
import { Button, Modal, message } from 'antd';
const { confirm } = Modal;
import useBus, { EventAction, dispatch } from 'use-bus';
import { Link, useNavigate } from 'react-router-dom';
import { RouteContext, RouteContextType } from '@ant-design/pro-layout';


export interface UpdateTreeNodeParams{
  e: any
  posPath: (string | number)[]
  updateRelation: (parent: any, e: any, parents: any[]) => void
  idKey: string
  childrenFieldName: string 
  debug: boolean
}

//给currentQuery中的初始值设置到columns中去，以让searchForm有正确的初始值
//顺带添加一些actions操作
function applyinitalQuery<T extends BaseRecord, Q extends BasePageQuery = BasePageQuery>(actions: ProColumns, props: MyProTableProps<T, Q>, 
  columns?: ProColumns<T>[], query?: Q) {
  //const supportEdit = props.editForm && typeof props.editForm === "function" && props.editForm()
  const {saveApi, delApi,  disableActions} = props

  //没有明确禁止，且有任意saveApi、delApi则添加actions
  if ((!disableActions && (saveApi || delApi)) && columns && columns.length > 0) {
    if (!ArrayUtil.contains(columns, actions, (e1, e2) => e1.title === e2.title)) {
      columns.push(actions)
    }
  }


  if (!query) return columns
  for (const item in query) {
    if (item) {
      const value = query[item]
      if (value === null || value === undefined || value === "") {

      } else {
        columns?.forEach((e) => {
          const key = e.key || e.dataIndex
          if (key === item) {
            e.initialValue = value
          }
        })
      }
    }
  }

  return columns
}
/**
 * 1. 列表数据可被缓存（若指定cacheKey的话），下次将会自动从缓存加载
 * 2. 搜索表单中的值自动被缓存： 上次搜索后的搜索条件将存储于缓存中，搜索表单将显示上次搜索值，列表数据将与结果对应；
 * 3. 支持设置初始查询条件，需提供initialQuery属性
 * 4. 分页将优先使用 LoadMore方式
 * 5. form表单（搜索和编辑中）中select支持异步远程获取结果：支持MyAsyncSelectProps属性转换成request函数
 * 6. 不需提供request、params、datasource等属性，取而代之的是需提供 listApi, 如需缓存需提供cacheKey、idKey等属性用于缓存
 * 7. 提供delApi将支持删除功能
 * 8 新增属性：myTitle，用于作为列表页和编辑页的title
 * 9. 支持自定义toolBarRender，若不提供，将默认有”新增“按钮（如果支持编辑的话）
 */
export const MyProTable = <T extends BaseRecord, Q extends BasePageQuery = BasePageQuery>(props: MyProTableProps<T, Q> & Omit<ProTableProps<T, Q, 'text'>, 'params' | 'request' | 'dataSource'>) => {

  const { isLoading, isError, errMsg, loadMoreState, setQuery, refreshCount, setRefresh, list, setList, setUseCache, setIsLoadMore }
    = useCacheList<T, Q>(props.listApi, props.cacheKey, props.initialQuery, props.needLoadMore === false ? false : true)

  //从缓存中加载上一次搜索条件，搜索form能实时更新展示出来，通过formRef?.current?.setFieldsValue(current.query)来实现
  const cachedQueryKey = (props.cacheKey || props.name) + "/cachedQuery"
  const v = CacheStorage.getItem(cachedQueryKey, StorageType.OnlySessionStorage)
  const currentQuery = v ? JSON.parse(v) : props.initialQuery
  const { current } = useRef({ query: { ...currentQuery } as Q })


  // console.log("currentQuery=", currentQuery)
  // console.log("current.query=", current.query)
  
  const dataSource = props.listTransform ? props.listTransform(list, props.listTransformArgs) : list
  //console.log("props=", props)
  //console.log("dataSource=", dataSource)

  //从缓存中刷新
  useBus('cacheUpdate-' + props.listApi, () => {
    if (MyProConfig.EnableLog) console.log("recv cacheUpdate notify, refresh=" + refreshCount)

    if (props.cacheKey) setRefresh()
  }, [refreshCount])

  useBus('loadChildrenDone-' + props.listApi, () => {
    if(props.cacheKey)  
      CacheStorage.saveObject(props.cacheKey, list)
    
      setList([...list])
  }, [list])

  useBus((e: EventAction) => e.type.indexOf("refreshList") >= 0,
    (e: EventAction) => {
      const type = e.type.toLowerCase()
      if (MyProConfig.EnableLog) console.log("recv notify type=" + type)
      const isTree = type.indexOf("tree") >= 0
      let flag = false
      if (isTree) {
        const p = e.payload as UpdateTreeNodeParams
        if (type.indexOf("add") >= 0) {
          flag = TreeCache.onAddOneInTreeList(p.e, p.posPath, p.updateRelation, list, p.idKey, p.childrenFieldName)
        } else if (type.indexOf("edit") >= 0) {
          flag = TreeCache.onEditOneInTree(p.e, p.posPath, list, p.idKey, p.childrenFieldName)
        } else if (type.indexOf("del") >= 0) {
          flag = TreeCache.onDelOneInTree(p.e, p.posPath, p.updateRelation, list, p.idKey, p.childrenFieldName)
        } else {
          console.warn("not support EventAction.type=" + type)
        }
      } else {
        if (type.indexOf("addoredit") >= 0) {
          if (!Cache.onEditOneInList(e.e, list, "id"))
            Cache.onAddOneInList(e.e, list)
          flag = true
        } else if (type.indexOf("add") >= 0) {
          Cache.onAddOneInList(e.e, list)
          flag = true
        } else if (type.indexOf("edit") >= 0) {
          flag = Cache.onEditOneInList(e.e, list, "id")
        } else if (type.indexOf("delbyid") >= 0) {
          flag = Cache.onDelOneInList(e.id, list, "id")
        } else if (type.indexOf("del") >= 0) {
          flag = Cache.onDelOneInList(e.e, list, "id")
        } else {
          console.warn("not support EventAction.type=" + type)
        }
      }
      if (flag) setList([...list])
    }, [list])


  const resetPagination = () => {
    const p = current.query?.pagination
    //如果值有改变，则重置lastId
    if (p) {
      setIsLoadMore(false)
      //修改搜索条件后，重置分页，从第一页开始
      //如果指定了current，且大于0，则优先使用current进行分页
      if (p.current) {
        p.current = 1
        p.lastId = undefined
      } else {
        p.lastId = undefined
      }
    }
  }
  const searchReset = () => {
    Cache.evictCache(cachedQueryKey, StorageType.OnlySessionStorage)

    resetPagination()
    const q = { ...props.initialQuery } as Q
    current.query = q
    if (MyProConfig.EnableLog) console.log("after searchReset: " + JSON.stringify(q))
    setUseCache(false)
    setQuery(q)
  }
  //useBus('searchReset', searchReset)

  const search = (params: Q) => {
    if (MyProConfig.EnableLog) console.log("search: " + JSON.stringify(params))
    resetPagination()
    const q = { ...params, pagination: current.query?.pagination } as Q
    current.query = q
    CacheStorage.saveObject(cachedQueryKey, q, StorageType.OnlySessionStorage)

    setUseCache(false)
    setQuery(q)
  }
  //useBus('search', (e: EventAction)=>{(search(e.payload))})

  const formRef = useRef<ProFormInstance>()
  useEffect(() => {
    //applyinitalQuery(props.columns, props.initialQuery)
    formRef?.current?.setFieldsValue(current.query)//设置为上一次缓存的搜索form值
    setQuery(current.query)
  }, [])


  //if (MyProConfig.EnableLog) console.log("isLoading=" + isLoading + ", current.query=" + JSON.stringify(current.query)+ ", list=" + JSON.stringify(list))


  return <RouteContext.Consumer>
    {(value: RouteContextType) => {
      const title = value.title ? value.title : ""
      //console.log("RouteContextType", value)

      //若提供了自定义的toolBarRender则优先使用自定义的,
      //没提供，则检查是否明确关闭了新增功能或没提供saveApi
      const myToolBarRender = props.toolBarRender ? props.toolBarRender :( (props.disableAdd || !props.saveApi) ? undefined: () => [
        <EditorHub title={title} tableProps={props} style='Button' isAdd={true} record={props.initialValues} columns={props.columns} />
      ] )

      //编辑、删除等按钮
      const actions: ProColumns = props.actions ? props.actions : {
        title: '操作',
        valueType: 'option',
        dataIndex: 'actions',
        render: (text, row) => [
           //不存在saveApi，或 disableEdit返回true，则没编辑按钮
          (!props.saveApi || (props.disableEdit && props.disableEdit(row))) ? undefined: <EditorHub title={title} tableProps={props} style='Link' isAdd={false} record={row} columns={props.columns} key="edit" />,// EditorHub('Link', false, row, props.columns, props.editConfig), //报错，undefined of length
          //不存在delApi，或 disableDel返回true，则没删除按钮
          (!props.delApi || (props.disableDel && props.disableDel(row)))? undefined : <a onClick={() => deleteOne(row, props.delApi + "/" + row[(props.idKey || UseCacheConfig.defaultIdentiyKey || "id")], undefined, props.listApi, props.cacheKey, props.idKey)} key="delete" >删除</a> ,
        ].filter((e) => !!e)
      }

      //避免applyinitalQuery添加actions时重复不断添加
     // const columns = useMemo(() => { return applyinitalQuery(actions, props.saveApi, props.delApi, props.columns, props.initialQuery) }, [])
      const columns = applyinitalQuery(actions, props, props.columns, props.initialQuery)

      return <div>
        <ProTable<T, Q>
          {...props}
          loading={isLoading}
          columns={columns}
          formRef={formRef} // 赋值ref
          dataSource={dataSource}
          rowKey={props.rowKey || props.idKey || "_id"}
          pagination={props.pagination ? props.pagination : false}
          onReset={searchReset}
          onSubmit={search}
          toolBarRender={myToolBarRender}
          scroll={{scrollToFirstRowOnChange: true}}
        //request?: ( params: U & {pageSize?: number; current?: number; keyword?: string;}, 
        //  sort: Record<string, SortOrder>, 
        //  filter: Record<string, (string | number)[] | null>) => Promise<Partial<RequestData<DataSource>>>;
        // request={(params, sort, filter) => {
        //   return fetchListCachely(props.listApi, params2Query(params, sort, filter), props.cacheKey)
        // }}
        />

        {props.needLoadMore !== false && list && list.length > 0 && <LoadMore
          loadMoreState={loadMoreState}
          isError={isError}
          errMsg={errMsg}
          loadMore={() => {
            setUseCache(false)
            setIsLoadMore(true)

            const p = current.query?.pagination

            //如果指定了current，且大于0，则优先使用current进行分页
            if (p?.current) {
              p.current += 1
              p.lastId = undefined
            } else {
              //排序时，若指定了sortKey则使用指定的，否则默认使用_id
             // const sortKey = (p?.sKey) ? p.sKey : (props.idKey || "_id")
              const lastValue = props.lastIdFunc? props.lastIdFunc(list[list.length - 1]) : list[list.length - 1][(p?.sKey) ? p.sKey : (props.idKey || "_id")] + "" //转换为字符串
              if (p)
                p.lastId = lastValue
              else {
                if (current.query) {
                  current.query.pagination = { lastId: lastValue }
                } else {
                  const q: BasePageQuery = { pagination: { lastId: lastValue } }
                  current.query = q as Q
                }
              }
            }

            setQuery(current.query)
          }}
        />}
      </div>;
    }}
  </RouteContext.Consumer>
}

/**
 * 根据editConfig判断是采用哪种editor，通常使用默认的ModalForm，不满足需求的话，可以进行链接跳转到自定义的编辑页面
 * @param style 按钮风格，使用普通链接还是按钮
 * @param isAdd 新增 or 编辑
 * @param record 编辑的对象记录，新增情况下也有可能有初始值
 * @param columns 列，即编辑的字段信息
 * @param editConfig 编辑配置：不提供则不进入编辑页面，若提供的是ProFormLayoutType（'ModalForm' | 'DrawerForm'），
 * 则按当前配置进入编辑页面；若提供的是函数并返回path路径，则跳转过去的路径，如"/admin/oa/edit", 
 * 若函数返回undefined则也没有编辑按钮。当用于新增时，初始数据不全，故函数参数用Partial 
 * @returns 
 */
function EditorHub<T extends BaseRecord, Q extends BasePageQuery>(props: EditProps<T, Q>) {
  const navigate = useNavigate();
  if (!props.tableProps?.saveApi) return null


  const oldValue = props.isAdd ? props.tableProps.initialValues : props.record

  const transformBeforeEdit = props.tableProps.transformBeforeEdit
  const record = transformBeforeEdit ? transformBeforeEdit(oldValue) : oldValue//edit之前进行转换

  const editFormConfig = props.tableProps?.editForm || "ModalForm"
  if (typeof editFormConfig === "function") {
    const path = editFormConfig(oldValue)
    if (path) {
      if (path === 'ModalForm' || path === 'DrawerForm') {
        return <MySchemaFormEditor {...props} record={record} key="editOne" />
      } else {
        const { style, isAdd } = props
        const state = { record: record, isAdd }
        if (style === 'Button') {
          //if(MyProConfig.EnableLog)console.log("prepare jump goto newOne")
          return <Button type="primary" onClick={() => { navigate(path, { state: state }) }} key="editLink">{isAdd ? '新建' : '修改'}</Button>
        } else {
          return <Link to={path} state={state} key="editLink">{isAdd ? '新建' : '修改'}</Link>
        }
      }
    }
    return null
  } else {
    return <MySchemaFormEditor {...props} record={record} key="editOne" />
  }

}



//'Form', 'ModalForm', 'DrawerForm', 'LightFilter', 'QueryFilter', 'StepsForm', 'StepForm', 'Embed',
export function MySchemaFormEditor<T extends BaseRecord, Q extends BasePageQuery>(props: EditProps<T, Q>) {
  // const { message } = App.useApp();
  const layout = props.tableProps.layoutType || 'ModalForm'
  const columns = props.tableProps.formColumns || (props.columns? (props.columns as any) : undefined)

  return <BetaSchemaForm<T>
    title={props.title}
    trigger={props.isAdd === true ? <Button type="primary"> <PlusOutlined />新增</Button> : <a>编辑</a>}
    layoutType={layout}
    initialValues={props.record}
    omitNil={false} //ProForm 会自动清空 null 和 undefined 的数数据，如果你约定了 nil 代表某种数据，可以设置为 false 关闭此功能
    columns={columns}
    onFinish={async (v) => {
      return saveOne(v,
        props.isAdd ? props.tableProps.initialValues : props.record,
        props.tableProps.saveApi,
        props.tableProps.transformBeforeSave,
        undefined,
        props.isAdd,
        props.tableProps.listApi,
        props.tableProps.cacheKey,
        props.tableProps.idKey)
    }}
    layout="horizontal"
  />

}


/**
 * 
 * @param values 需要保存的新值，将与旧值合并，因为编辑时并不是编辑全部信息，新值只有form中的信息
 * @param oldValues 旧值，未被编辑的值将存在于旧值中
 * @param saveApi 必须提供，否则给出错误提示
 * @param transformBeforeSave 保存前对值进行变换
 * @param onSaveOK 保存成功后的动作，若不提供将使用缺省的更新缓存操作 参数data是保存后后端返回的更新的值，往往新增了id字段
 * @param isAdd 是否新增
 * @param listApi 保存成功后的动作 更新缓存后需决定向哪个列表发送消息
 * @param cacheKey 保存成功后的动作：更新缓存需要
 * @param idKey 保存成功后的动作：更新缓存需要
 * @returns 
 */
export function saveOne<T extends BaseRecord, ResultType = T>(
  values: T,
  oldValues?: Partial<T>,
  saveApi?: string,
  transformBeforeSave?: (data: T) => T | undefined,
  onSaveOK?: (data: ResultType) => void, //若提供了onSaveOK，可不提供后面的信息（用于更新缓存）
  isAdd?: boolean,
  listApi?: string,
  cacheKey?: string,
  idKey?: string
) {
  if (!saveApi) {
    console.warn("no saveApi")
    alert("no saveApi")
    return false
  }

  if (MyProConfig.EnableLog) {
    console.log("saveOne: oldValues=", oldValues)
    console.log("saveOne:  values=", values)
  }
  const newValues: T = Object.assign({ ...oldValues }, values) //{ ...oldValues, ...values } //bugfix如果修改时去掉了某字段值，则values中为undfined，而合并后依旧是旧值，没有去掉 通过ProForm的omitNil={false} 禁止自动清空 null 和 undefined 的数据解决
  if (MyProConfig.EnableLog) {
    //此处输出的newValues值是后续已经transform的，因为输出延迟，拿到的值已经被transform
    console.log("after values merge oldValues, new values=", newValues)
  }

  const onOK = onSaveOK || ((data: ResultType) => {
    message.success('保存成功');

    const myIdKey = idKey || UseCacheConfig.defaultIdentiyKey || "id"
    if (cacheKey) {
      if (isAdd === undefined) {//未定状态，如Rule的新增也可能是更新
        if (!Cache.onEditOne(cacheKey, data, myIdKey)) {//未找到更新，则按新增处理
          Cache.onAddOne(cacheKey, data)
        }
      } else if (isAdd) {
        Cache.onAddOne(cacheKey, data)
      } else {
        Cache.onEditOne(cacheKey, data, myIdKey)
      }
      if (listApi) dispatch("cacheUpdate-" + listApi)
    }else{
      if (isAdd === undefined) {//未定状态，如Rule的新增也可能是更新
        dispatch({ type: "refreshList-addOrEdit-" + listApi, e: data }) 
      } else if (isAdd) {
        dispatch({ type: "refreshList-add-" + listApi, e: data }) 
      } else {
        dispatch({ type: "refreshList-edit-" + listApi, e: data }) 
      }
    }
    
  })


  const transformedData = transformBeforeSave ? transformBeforeSave(newValues) : newValues//提交数据前对数据进行变换
  if(!transformedData){//返回undefined时，意味着转换校验有错误，不再进行下去
    return false
  }
  // if (MyProConfig.EnableLog) {
  //   console.log("after transformed, values=", transformedData);
  // }

  cachedFetchPromise<ResultType>(saveApi, 'POST', transformedData)//undefined, StorageType.OnlySessionStorage, undefined,undefined,false
    .then((data) => {
      if (data) {
        onOK(data)
      }
      else { console.log("no data return after save") }
      return new Promise((resolve) => { resolve(true) });
    }).catch((err) => {
      console.warn("exception: " + err.message)
      message.error(err.message)
    })

  return true;
}

/**
 * 
 * @param item 待删除项
 * @param delApi 删除api
 * @param onDelOk 删除成功后的回调，用于更新缓存，可自定义, 若提供了onDelOk可不提供后面的缓存参数
 * @param listApi 消息通知更新哪个列表
 * @param cacheKey 删除项所对应缓存
 * @param idKey 更新缓存比较时，以哪个键为准
 * @returns 
 */
export function deleteOne<T = number>(
  item: Record<string, any>,
  delApi?: string,
  onDelOk?: (result: T) => void,
  listApi?: string,
  cacheKey?: string,
  idKey?: string
) {
  if (!delApi) {
    alert("no delApi")
    return
  }

  const id = item ? item[idKey || UseCacheConfig.defaultIdentiyKey] : undefined
  if (!onDelOk && !id) {
    alert("no id")
    console.warn("no id when del, please set pageProps.key or UseCacheConfig.defaultIdentiyKey")
    return
  }
  confirm({
    title: '确定要删除吗？',
    icon: <ExclamationCircleFilled />,
    content: '删除后不能恢复',
    onOk: () => {
      cachedFetch<T>({
        url: delApi,
        method: "GET",
        attachAuthHeader: true,
        isShowLoading: true,
        onOK: onDelOk || ((result: T) => {
          if (MyProConfig.EnableLog) console.log("successfully del:" + id)
          if (cacheKey){
             Cache.onDelOneById(cacheKey, id, idKey)
             dispatch("cacheUpdate-" + listApi) //删除完毕，发送refreshList，告知ListView去更新
          }else{
            dispatch({ type: "refreshList-delById-" + listApi, id: id }) 
          }

          message.success(result + "条记录被删除")
        })
      });
    }
  });
}