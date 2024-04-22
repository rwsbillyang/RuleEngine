import { Host } from "@/Config";
import { EasyProTableProps } from "easy-antd-pro";
import { BasePageQuery, BaseRecord } from "@rwsbillyang/usecache";


export const mustFill = {
  rules: [
    {
      required: true,
      message: '此项为必填项',
    },
  ],
}


/**
 * 
 * @param name object name
 * @param supportDel defalut true
 * @returns 返回 EasyProTableProps的部分属性
 */
export interface ModuleProps<T extends BaseRecord, Q extends BasePageQuery> extends EasyProTableProps<T, Q>{
  title?: string,
  name: string,
  supportDel?: boolean //default true,
}

/**
 * 
 * @returns 返回 EasyProTableProps的部分属性
 */
export function defaultProps(name: string, cacheTable: boolean = true, supportDel: boolean = true, supportAdd: boolean = true) {
    const host =  Host

    return {
      idKey: "id",
      name: name,
      cacheKey: cacheTable? name: undefined,
      listApi: `${host}/api/rule/composer/list/${name}`,
      delApi: supportDel?  `${host}/api/rule/composer/del/${name}` : undefined, 
      saveApi: supportAdd? `${host}/api/rule/composer/save/${name}` : undefined, 
    }
  }