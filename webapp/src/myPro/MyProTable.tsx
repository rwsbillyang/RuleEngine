import React, { useEffect, useMemo, useRef } from 'react';
import { PlusOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import ProTable, { ProColumns } from '@ant-design/pro-table';
import { Cache, BasePageQuery, StorageType, CacheStorage, useCacheList, BaseRecord, UseCacheConfig, cachedFetch, cachedFetchPromise, contains } from '@rwsbillyang/usecache';
import { EditProps, MyProTableProps } from './MyProTableProps';
import { MyProConfig } from './MyProConfig';

import { LoadMore } from './LoadMore';
import { BetaSchemaForm, ProFormInstance } from '@ant-design/pro-form';
import { Button, Modal, message } from 'antd';
const { confirm } = Modal;
import useBus, { dispatch } from 'use-bus';
import { Link, useNavigate } from 'react-router-dom';

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
export const MyProTable = <T extends BaseRecord, Q extends BasePageQuery = BasePageQuery>(props: MyProTableProps<T, Q>) => {

  const { isLoading, isError, errMsg, loadMoreState, setQuery, refreshCount, setRefresh, list, setUseCache, setIsLoadMore }
    = useCacheList<T, Q>(props.listApi, props.cacheKey, props.initialQuery, props.needLoadMore === false ? false : true)

  //从缓存中加载上一次搜索条件，搜索form能实时更新展示出来，通过formRef?.current?.setFieldsValue(current.query)来实现
  const cachedQueryKey = props.cacheKey + "/cachedQuery"
  const v = CacheStorage.getItem(cachedQueryKey, StorageType.OnlySessionStorage)
  const currentQuery = v ? JSON.parse(v) : props.initialQuery
  const { current } = useRef({ query: { ...currentQuery } as Q })

  //删除后从缓存中刷新
  useBus('refreshList-' + props.listApi, () => {
    setRefresh()
    if (MyProConfig.EnableLog) console.log("recv refreshList notify, refresh=" + refreshCount)
  }, [refreshCount])


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

  //编辑、删除等按钮
  const actions: ProColumns = props.actions ? props.actions : {
    title: '操作',
    valueType: 'option',
    dataIndex: 'actions',
    render: (text, row) => [
      // EditorHub('Link', false, row, props.columns, props.editConfig), //报错，undefined of length
      <EditorHub tableProps={props} style='Link' isAdd={false} record={props.editConfig?.convertValue ? props.editConfig?.convertValue(row) : row} columns={props.columns} key="edit" />,// //编辑某行数据时，编辑前对其进行变换
      props.delApi ? <a onClick={() => deleteOne(props, row)} key="delete" >删除</a> : undefined,
    ].filter((e) => !!e)
  }

  //给currentQuery中的初始值设置到columns中去，以让searchForm有正确的初始值
  //顺带添加一些actions操作
  const applyinitalQuery = (columns?: ProColumns[], query?: Q) => {
    const supportEdit = props.editConfig?.edit && typeof props.editConfig.edit === "function" && props.editConfig.edit()
    
    if ((supportEdit || props.delApi) && columns && columns.length > 0 ){
      if(!contains(columns, actions, (e1, e2) => e1.title === e2.title)){
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

  //避免applyinitalQuery添加actions时重复不断添加
  useMemo(() => { return applyinitalQuery(props.columns, props.initialQuery) }, [])

  //if (MyProConfig.EnableLog) console.log("isLoading=" + isLoading + ", current.query=" + JSON.stringify(current.query)+ ", list=" + JSON.stringify(list))

  //若提供了自定义的toolBarRender则优先使用自定义的
  const myToolBarRender = props.toolBarRender ? props.toolBarRender : () => [
    <EditorHub tableProps={props} style='Button' isAdd={true} record={props.initialValues} columns={props.columns} />
  ]

  return <div>
    <ProTable<T, Q>
      {...props}
      title={() => props.myTitle}
      loading={isLoading}
      columns={props.columns}
      formRef={formRef} // 赋值ref
      dataSource={list}
      rowKey={props.idKey || "_id"}
      pagination={props.pagination ? props.pagination : false}
      onReset={searchReset}
      onSubmit={search}
      toolBarRender={myToolBarRender}

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
          const sortKey = (p?.sKey) ? p.sKey : (props.idKey || "_id")
          const lastValue = list[list.length - 1][sortKey] + "" //转换为字符串
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
  </div>
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
  if (!props.tableProps?.editConfig) return null

  const { style, isAdd, record } = props
  const editConfig = props.tableProps?.editConfig
  if (typeof editConfig.edit === "function") {
    const path = editConfig.edit(record)
    if (path) {
      if (path === 'ModalForm' || path === 'DrawerForm') {
        return <MySchemaFormEditor {...props} key="editOne" />
      } else {
        const state = {record, isAdd}
        if (style === 'Button'){
          //if(MyProConfig.EnableLog)console.log("prepare jump goto newOne")
          return <Button type="primary" onClick={() => { navigate(path, { state:state }) }} key="editLink">{isAdd ? '新建' : '修改'}</Button>
        }else {
          return <Link to={path} state={state} key="editLink">{isAdd ? '新建' : '修改'}</Link>
        }
      }
    }
    return null
  } else {
    return <MySchemaFormEditor {...props} key="editOne" />
  }

}



//'Form', 'ModalForm', 'DrawerForm', 'LightFilter', 'QueryFilter', 'StepsForm', 'StepForm', 'Embed',
function MySchemaFormEditor<T extends BaseRecord, Q extends BasePageQuery>(props: EditProps<T, Q>) {
  // const { message } = App.useApp();
  const layout = props.tableProps.layoutType || 'ModalForm'
  const columns = props.columns

  return <BetaSchemaForm<T>
    title={props.tableProps.myTitle}
    trigger={props.isAdd === true ? <Button type="primary"> <PlusOutlined />新增</Button> : <a>编辑</a>}
    layoutType={layout}
    initialValues={props.isAdd ? props.tableProps.initialValues : props.record}
    columns={columns ? (columns as any) : undefined}
    onFinish={async (values) => {
      return saveOne(values, props.tableProps, props.isAdd, props.isAdd ? props.tableProps.initialValues : props.record)
    }}
    layout="horizontal"
  />

}

export function saveOne<T extends BaseRecord, Q extends BasePageQuery>(values: T, tableProps: MyProTableProps<T, Q>, isAdd?: boolean, oldValues?: Partial<T>) {
  // if(MyProConfig.EnableLog){
  //   console.log("saveOne: oldValues=", oldValues)
  //   console.log("saveOne:  values=", values)
  // }
  const newValues: T = { ...oldValues, ...values }
  // if(MyProConfig.EnableLog){
  //   //此处输出的newValues值是后续已经transform的，因为输出延迟，拿到的值已经被transform
  //   console.log("after values merge oldValues, new values=", newValues) 
  // }

  if (tableProps?.editConfig) {

    const onOK = (data: T) => {
      message.success('保存成功');
      const cacheKey = tableProps.cacheKey
      if (cacheKey) {
        const idKey = tableProps.idKey || UseCacheConfig.defaultIdentiyKey || "_id"
        if(isAdd === undefined){//未定状态，如Rule的新增也可能是更新
          if(!Cache.onEditOne(cacheKey, data, idKey)){//未找到更新，则按新增处理
            Cache.onAddOne(cacheKey, data)
          }
        }else if (isAdd) {
          Cache.onAddOne(cacheKey, data)
        } else {
          Cache.onEditOne(cacheKey, data, idKey)
        }
        dispatch("refreshList-" + tableProps.listApi)
      }
    }

    const transform = tableProps.editConfig?.transform //提交数据前对数据进行变换
    const transformedData =   transform ? transform(newValues) : newValues
    if (MyProConfig.EnableLog) {
      console.log("after transformed, values=", transformedData);
    }

    cachedFetchPromise<T>(tableProps.editConfig?.saveApi, 'POST', transformedData)//undefined, StorageType.OnlySessionStorage, undefined,undefined,false
      .then((data) => {
        if (data)
          onOK(data)
        else { console.log("no data return after save") }
        return new Promise((resolve) => { resolve(true) });
      }).catch((err) => {
        console.warn("exception: " + err)
        message.error(err)
      })

  } else {
    console.warn("no tableProps.editConfig")
    message.warning('没有配置editConfig信息');
  }

  return true;
}

export function deleteOne<T extends BaseRecord, Q extends BasePageQuery>(pageProps: MyProTableProps<T, Q>, item?: Record<string, any>) {
  const id = item ? item[pageProps.idKey || UseCacheConfig.defaultIdentiyKey] : undefined
  if (!id) {
    alert("no id")
    console.warn("no id when del, please set pageProps.key or UseCacheConfig.defaultIdentiyKey")
    return
  }
  confirm({
    title: '确定要删除吗？',
    icon: <ExclamationCircleFilled />,
    content: '删除后不能恢复',
    onOk: () => {
      cachedFetch<number>({
        url: pageProps.delApi + "/" + id,
        method: "GET",
        attachAuthHeader: true,
        isShowLoading: true,
        onOK: () => {
          if (MyProConfig.EnableLog) console.log("successfully del:" + id)
          if (pageProps.cacheKey) Cache.onDelOneById(pageProps.cacheKey, id, pageProps.idKey)

          dispatch("refreshList-" + pageProps.listApi) //删除完毕，发送refreshList，告知ListView去更新
        }
      });
    }
  });
}