import { Host } from "@/Config";
import { MyProTableProps } from "@/myPro/MyProTableProps";
import { BasePageQuery, BaseRecord } from "@rwsbillyang/usecache";

/**
 * 
 * @param name object name
 * @param supportDel defalut true
 * @returns 返回 MyProTableProps的部分属性
 */
export interface ModuleProps<T extends BaseRecord, Q extends BasePageQuery> extends MyProTableProps<T, Q>{
  title?: string,
  name: string,
  supportDel?: boolean //default true,
}

/**
 * 
 * @returns 返回 MyProTableProps的部分属性
 */
export function defaultProps(name: string, supportDel: boolean = true, supportAdd: boolean = true) {
    const host =  Host

    return {
      idKey: "id",
      cacheKey: name,
      listApi: `${host}/api/rule/composer/list/${name}`,
      delApi: supportDel?  `${host}/api/rule/composer/del/${name}` : undefined, 
      saveApi: supportAdd? `${host}/api/rule/composer/save/${name}` : undefined, 
    }
  }