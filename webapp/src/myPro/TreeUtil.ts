import { StorageType, UseCacheConfig, CacheStorage, Cache } from "@rwsbillyang/usecache";

/**
 * 在缓存中返回通过path节点id路径返回对应的元素数组
 * @param shortKey 
 * @param path 
 * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
 * @param childrenFieldName 存储父节点id信息的字符串，默认 children
 * @param storageType 缓存类型
 */
export function getElementsByPathIdsInTreeFromCache(
    shortKey: string,
    path?: (string | number)[],
    idKey: string = UseCacheConfig.defaultIdentiyKey,
    childrenFieldName: string = "children",
    storageType: number = UseCacheConfig.defaultStorageType) {
    if (storageType === StorageType.NONE)
        return undefined
    if (!path || path.length === 0){
        console.log("no path")
        return undefined}

    const str = CacheStorage.getItem(shortKey, storageType)
    if (str) {
        let array: any[] = JSON.parse(str)
        return getElementsByPathIdsInTree(array, path, childrenFieldName, idKey, storageType)
    }
    return undefined
}
/**
 * 在缓存中返回通过path节点id路径返回对应的元素数组
 * @param tree 
 * @param path 
 * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
 * @param childrenFieldName 存储父节点id信息的字符串，默认 children
 * @param storageType 缓存类型
 */
export function getElementsByPathIdsInTree(
    tree?: any[],
    path?: (string | number)[],
    idKey: string = UseCacheConfig.defaultIdentiyKey,
    childrenFieldName: string = "children",
    storageType: number = UseCacheConfig.defaultStorageType,
    debug: boolean = true) {
    if (storageType === StorageType.NONE)
        return undefined
    if (!tree || tree.length === 0 || !path || path.length === 0)
        return undefined

    const ret: any[] = []
    let array = tree
    for (let i = 0; i < path.length; i++) {
        if (array && array.length > 0) {
            if (debug) console.log("find " + path[i])
            const e = Cache.findOneInArray(array, path[i], idKey)
            if (e) {
                ret.push(e)
                array = e[childrenFieldName]
            }
        }
    }
    return ret
}

/**
 * 从数组array中，根据children字段查找某节点e
 * @param shortKey 存储数组都的cache key, 由其得到待查询的数组
 * @param id 待查找的元素id
 * @param all 是否获取所有，否则只是第一个路径
 * @param childrenFieldName 存储父节点id信息的字符串，默认 children
 * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
 * @param storageType 缓存类型
 * @returns 如果all为true（默认），返回所有path路径数组，否则返回path。 path是从根节点到所寻找叶子节点的数组
 */
export function getPathFromTreeCacheKey(shortKey: string, id: string | number | undefined,
    all: boolean = true, childrenFieldName: string = "children",
    idKey: string = UseCacheConfig.defaultIdentiyKey,
    storageType: number = UseCacheConfig.defaultStorageType): any[][] | any[] | undefined {

    if (id === undefined) {
        if (UseCacheConfig.EnableLog) console.log("Cache.findOne: no id")
        return undefined
    }
    if (storageType === StorageType.NONE)
        return undefined

    const str = CacheStorage.getItem(shortKey, storageType)
    if (str) {
        let array: any[] = JSON.parse(str)
        if (all) {
            const allPaths: any[][] = []
            getAllPathFromTreeArray(allPaths, array, id, childrenFieldName, idKey)
            return allPaths
        } else {
            return getOnePathFromTreeArray(array, id, childrenFieldName, idKey)?.reverse()
        }
    }
    return undefined
}
/**
 * 从数组rootArray中，找到一条命中路径
 * @param rootArray 数组
 * @param id 待查找的元素id
 * @param childrenFieldName 存储父节点id信息的字符串，默认 children
 * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
 * @returns 返回数组：叶节点排最前，根节点最后
 */
export function getOnePathFromTreeArray(rootArray: any[], id?: string | number | undefined,
    childrenFieldName: string = "children",
    idKey: string = UseCacheConfig.defaultIdentiyKey,
    debug: boolean = false): any[] | undefined {

    if (!rootArray || !id) return undefined

    let e
    for (let i = 0; i < rootArray.length; i++) {
        const path: any[] = []
        e = rootArray[i]
        if (debug) console.log("check id=" + e[idKey])
        if (e[idKey] === id) {
            path.push(e)
            if (debug) console.log("got one: id=" + e[idKey] + ", return path=", path)
            return path //找到一个元素即返回一个数组
        } else {
            if (debug) console.log("check children, id=" + e[idKey])
            const children = e[childrenFieldName]
            if (children) {
                //递归，从数组（孩子）中找到一个即返回一个数组，然后压入父节点，返回压入父节点的数组
                const p2: any[] | undefined = getOnePathFromTreeArray(children, id, childrenFieldName, idKey)
                if (p2) {
                    p2.push(e)
                    if (debug) console.log("got one in child: id=" + e[idKey] + ", return path=", p2)
                    return p2
                }
            }
        }
    }
    return undefined
}

/**
 * 
 * @param allPaths 最后结果保存在该数组中，返回多条路径，每条路径是从根元素到所寻找叶子节点元素的数组
 * @param rootArray 数组
 * @param id 待查找的元素id
 * @param childrenFieldName 存储父节点id信息的字符串，默认 children
 * @param idKey 数组 数组中元素进行相等性比较时，用哪个字段，默认id，若元素的id相同，就认为两个元素相同
 * @param tempPath 临时变量，内部实现使用，不要传递
 * @returns 
 */
export function getAllPathFromTreeArray(allPaths: any[][], rootArray: any[], id?: string | number | undefined,
    childrenFieldName: string = "children", idKey: string = UseCacheConfig.defaultIdentiyKey, tempPath: any[] = []) {
    if (!rootArray || !id) return

    for (let i = 0; i < rootArray.length; i++) {
        const e = rootArray[i]

        tempPath.push(e) //压入当前节点到tempPath

        if (e[idKey] === id) { //找到一个， 压入path，不再对其children进行查找          
            allPaths.push([...tempPath]) //找到后也没有return返回，而是继续该循环查找其它兄弟节点
        } else {//没有相等，则是查找子节点
            const children = e[childrenFieldName]
            if (children) {
                //递归，在孩子数组中相同的查找，并将path传递进来，一遍记录path节点
                getAllPathFromTreeArray(allPaths, children, id, childrenFieldName, idKey, tempPath)
            }
        }

        tempPath.pop()
    }
}





export function removeOneFromArray(
    array: any[],
    id: string | number | undefined,
    idKey: string = UseCacheConfig.defaultIdentiyKey,
    storageType: number = UseCacheConfig.defaultStorageType) {
    if (!array || array.length === 0 || id === undefined || storageType === StorageType.OnlySessionStorage) return false
    for (let i = 0; i < array.length; i++) {
        if (array[i][idKey] === id) {
            array.splice(i, 1)
            return true;
        }
    }
    return false
}



export function testTreeSearch() {
    const array = [
        { id: "1", children: [{ id: "1.1" }, { id: "1.2", children: [{ id: "hit2" }] }, { id: "1.3" }] },
        { id: "2", children: [{ id: "2.1" }, { id: "2.2" }, { id: "2.3", children: [{ id: "hit2" }] }] },
        { id: "3", children: [{ id: "3.1" }, { id: "3.2" }, { id: "3.3" }] },
        { id: "hit2" },
        { id: "5", children: [{ id: "5.1" }, { id: "5.2" }, { id: "5.3", children: [{ id: "5.3.1" }, { id: "5.3.2", children: [{ id: "5.3.2.1" }, { id: "hit2" }] }] }] },
    ]

    const path = getOnePathFromTreeArray(array, "hit2", "children", "id", true)
    console.log("path=", path)

    const allPaths: any[][] = []
    getAllPathFromTreeArray(allPaths, array, "hit2", "children", "id")
    console.log("allPaths:", allPaths)


    const path2 = getElementsByPathIdsInTree(array, ["2", "2.3", "hit2"], "id")
    console.log("path2=", path2)
}


const tree = {
    "id": 1,
    "level": 0,
    "label": "r",
    "ruleChildrenIds": "2",
    "children": [
      {
        "parentPath": [
          1,
          2,
          3
        ],
        "rule": {
          "id": 2,
          "level": 1,
          "label": "r1-1",
         
          "ruleChildrenIds": "3",
          "ruleParentIds": "1",
          "children": [
            {
              "parentPath": [
                1,
                2,
                3
              ],
              "rule": {
                "id": 3,
                "level": 2,
                "label": "r-1-1",
               
                "ruleParentIds": "2"
              },
              "id": 2,
              "level": 3,
              "label": "r-1-1",
              "priority": 50,
  
            }
          ]
        },
        "id": 1,
        "level": 2,
        "label": "r1-1",
  
      }
    ]
  }