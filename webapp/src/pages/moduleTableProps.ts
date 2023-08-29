import { Host } from "@/Config";
import { BaseRecord } from "@rwsbillyang/usecache";

/**
 * 
 * @param name object name
 * @param Host such as "http://127.0.0.1:18000"
 * @param needLoadMore  default true
 * @param supportDel defalut true
 * @param edit default 'ModalForm', if dynamic please provide function
 * @param transform 提交保存前对提交的数据进行修改变换
 * @param convertValue 编辑某行数据时，编辑前对其进行变换。注意：未对table中的列表数据进行变换，只是在编辑前，对编辑数据进行变换
 * @returns 返回 MyProTableProps的部分属性
 */
export interface ModuleProps<T extends BaseRecord> {
  title?: string,
  name: string,
  cacheKey?: string
  Host?: string //= "",
  needLoadMore?: boolean// default true,
  supportDel?: boolean //default true,
  edit?: 'ModalForm' | 'DrawerForm' | ((e?: Partial<T>) => string | 'ModalForm' | 'DrawerForm' | undefined) // default 'ModalForm',
  transform?: (data: T) => T, ////提提交保存前对提交的数据进行修改变换
  convertValue?: (data: T) => T//编辑某行数据时，编辑前对其进行变换。注意：未对table中的列表数据进行变换
}
/**
 * 
 * @returns 返回 MyProTableProps的部分属性
 */
export function moduleTableProps<T extends BaseRecord>(props: ModuleProps<T>) {
    const host = props.Host || Host
    const supportDel = props.supportDel === undefined ?  true : props.supportDel
    const needLoadMore = props.needLoadMore  === undefined ?  true : props.needLoadMore
    const edit = props.edit || 'ModalForm'

    return {
      myTitle: props.title,
      idKey: "id",
      cacheKey: props.cacheKey || props.name,
      listApi: `${host}/api/rule/composer/list/${props.name}`,
      delApi: supportDel ? `${host}/api/rule/composer/del/${props.name}` : undefined,
      editConfig: { edit: edit, saveApi: `${host}/api/rule/composer/save/${props.name}`, transform: props.transform, convertValue: props.convertValue }, //(e) => `/rule/composer/edit/${name}`
      needLoadMore: needLoadMore,
    }
  }