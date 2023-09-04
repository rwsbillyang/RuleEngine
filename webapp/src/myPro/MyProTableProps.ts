
import { BasePageQuery, StorageType, BaseRecord, cachedFetchPromise } from "@rwsbillyang/usecache";

import { ProColumns } from "@ant-design/pro-table";



/**
 * @param editForm: 若提供的是ProFormLayoutType('ModalForm' | 'DrawerForm' )，则按当前配置进入编辑页面；
 * 若提供的是函数并返回path路径，则跳转过去的路径，如"/admin/oa/edit", 若函数返回undefined则也没有编辑按钮。
 * 当用于新增时，初始数据不全，故函数参数用Partial 
 * @param saveApi: saveApi 保存api，后端需支持post方法
 * @param transformBeforeSave 提交保存前对提交的数据进行修改变换
 * @param transformBeforeEdit 编辑某行数据时，编辑前对其进行变换。注意：未对table中的列表数据进行变换，只是在编辑前，对编辑数据进行变换
 */

export interface MyProTableProps<T extends BaseRecord, Q extends BasePageQuery> {
  myTitle?: string,   //TODO：以后无需提供，从route中提取
  initialQuery?: Q //列表初始查询条件
  listApi: string, //请求列表api，如'/api/oa/admin/list'
  needLoadMore?: boolean //默认为true，是否显示加载更多按钮 
  listTransform?: (list: T[]) => T[] //对列表数据进行变换
 
  delApi?: string, // 不提供则无删除按钮，删除Api， 如"/api/ad/admin/del" ，将自动再最后拼接id，最后拼接为："/api/ad/admin/del/{id}"
  actions?:  ProColumns //操作Action，不提供的话根据editConfig和delApi决定是否编辑和删除按钮

  initialValues?: Partial<T> //新增时的给定初始值，用于传递给MySchemaFormEditor
  layoutType?: 'ModalForm' | 'DrawerForm'//editor中的layout类型，用于传递给MySchemaFormEditor
  editForm?: 'ModalForm' | 'DrawerForm' | ((e?: Partial<T>) => string | 'ModalForm' | 'DrawerForm' | undefined)
  saveApi?: string, //若有新增&编辑保存功能，需提供saveApi
  transformBeforeEdit?: (data?: Partial<T>) => Partial<T> | undefined//编辑某行数据时，编辑前对其进行变换。注意：未对table中的列表数据进行变换
  transformBeforeSave?: (data: T) => T //提提交保存前对提交的数据进行修改变换
  idKey?: string //primary key, _id for mongoDB doc, id for sql record
  cacheKey?: string //不同的搜索条件initialQuery，应给出不同的缓存键值，如： appId+"/fan/"+scene，否则可能共用列表值
}



export interface EditProps<T extends BaseRecord, Q extends BasePageQuery> {
  tableProps: MyProTableProps<T, Q>,
  style: 'Button' | 'Link',
  isAdd: boolean,
  record?: Partial<T>,
  columns?: ProColumns[]
}

/**
 * @param key 若缓存结果则需提供，且下次首先将从缓存中获取
 * @param url GET请求的url
 * @param query GET请求参数
 * @param convertFunc 请求结果转换，若不需转换则无需提供
 */
export interface MyAsyncSelectProps<T extends BaseRecord, Q extends BasePageQuery = BasePageQuery> {
  key?: string //缓存键
  url: string //请求url
  query?: Q //请求参数
  convertFunc?: (item: T) => { label: string, value?: string | number | object } //将请求结果转换为select option
}


export const asyncSelectProps2Request = <T extends BaseRecord, Q extends BasePageQuery>(props: MyAsyncSelectProps<T, Q>, params?: any) => {
  //console.log(JSON.stringify(params))
  //const queryStr = query2Params()
  return cachedFetchPromise(props.url, "GET", props.query, props.key, StorageType.OnlySessionStorage, undefined, (bizData: any) => bizData.map((e: any) => props.convertFunc ? props.convertFunc(e) : e))
}
