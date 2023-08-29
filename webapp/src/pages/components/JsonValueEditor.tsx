import React from "react";
import dayjs from "dayjs";
import { DatePicker, Input, InputNumber, Select, Switch } from "antd";
import { JsonValue } from "../DataType";


/**
 * 根据类型选择不同的输入框
 * @param type 'Bool' | 'Int' | 'Long' | 'Double' | 'Datetime' | 'String'
 * @returns 根据type返回antd控件，需提供onChange自行管理编辑的值
 * 
 * 里面的字段UI全部是受控组件
 */
export const JsonValueEditor: React.FC<{
  type?: string,
  multiple: boolean,
  disabled?: boolean,
  width?: string,
  value?: JsonValue,
  onChange: (value?: JsonValue) => void
}> = ({ type, multiple, disabled, width, value,  onChange }) => {
  //console.log("JsonValueEditor: jsonValue="+JSON.stringify(jsonValue))
  if (multiple) {
    return <Select style={{ width: width }} mode="tags" tokenSeparators={[',']} disabled={disabled} value={value?.value} onChange={(v) => onChange({ _class: type || 'String', value: (type === 'Int' || type === 'Long' || type === 'Double') ? (Array.isArray(v) ? v.map((e) => +e) : +v) : v })} />
  } else {
    if (type === 'Bool')
      return <Switch style={{ width: width }} disabled={disabled} checked={value?.value === true} onChange={(v) => onChange({ _class: type, value: v })} />
    if (type === 'Datetime')
      return <DatePicker style={{ width: width }} showTime disabled={disabled} value={value?.value ? dayjs(value.value.toString(), 'YYYY-MM-DD HH:mm:ss') : undefined} onChange={(v) => onChange({ _class: type, value: v ? v.format('YYYY-MM-DD HH:mm:ss') : undefined })} />
    if (type === 'Int' || type === 'Long' || type === 'Double')
      return <InputNumber style={{ width: width }} disabled={disabled} value={value?.value ? +value.value : undefined} onChange={(v) => onChange({ _class: type, value: v ? v : undefined })} />
    else
      return <Input style={{ width: width }} disabled={disabled} value={value?.value ? value.value.toString() : undefined} onChange={(v) => onChange({ _class: type || 'String', value: v ? v.target.value : undefined })} />
  }

}
