import { Cache } from '@rwsbillyang/usecache'
import { AllParamTypeKey,  ParamType } from "../DataType"

/**
 * 为变量设置值域时，不仅仅基本类型可以有值域，Set集合类型也可以有对应的基本类型的值域
 * 
 * @returns 获取基本类型的id，只有Set集合类型才更换成基本类似的typeId，依赖于缓存AllParamTypeKey对应的数据
 */
export const getBasicTypeId = (parmTypeId?: number) => {
    if(parmTypeId === undefined) return parmTypeId
    let basicTypeId = parmTypeId
    
    const paramType: ParamType = Cache.findOne(AllParamTypeKey, parmTypeId, "id")
    if (paramType) {
        const end = paramType.code.indexOf("Set")
        //console.log("end="+end)
        if (end && end > 0) {
            const basicTypeCode = paramType.code.slice(0, end)
            const basicType = Cache.findOne(AllParamTypeKey, basicTypeCode, "code")
            if (basicType) {
                basicTypeId = basicType.id
                //console.log("basicTypeId=" + basicTypeId + ", basicType.code="+basicType.code)
            }
        }

    }
    return basicTypeId
}

export const typeCode2Id = (parmTypeCode: string) => {
    const paramType: ParamType = Cache.findOne(AllParamTypeKey, parmTypeCode, "code")
    return paramType?.id
  }