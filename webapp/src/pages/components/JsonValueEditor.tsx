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
  onChange?: (value?: JsonValue) => void
}> = ({ type, multiple, disabled, width, value,  onChange }) => {
  console.log("JsonValueEditor: multiple="+multiple+",jsonValue="+JSON.stringify(value))
  if (multiple) {
    //TODO: 不同的类型通过数组的方式给予支持
    return <Select style={{ width: width }} mode="tags" allowClear tokenSeparators={[',']} disabled={disabled} value={value?.value} onChange={onChange? (v) => onChange({ _class: type || 'String', value: (type === 'Int' || type === 'Long' || type === 'Double') ? (Array.isArray(v) ? v.map((e) => +e) : +v) : v }): undefined} />
  } else {
    if (type === 'Bool')
      return <Switch style={{ width: width }} disabled={disabled} checked={value?.value === true} onChange={onChange? (v) => onChange({ _class: type, value: v }): undefined} />
    if (type === 'Datetime')
      return <DatePicker style={{ width: width }} showTime disabled={disabled} value={value?.value ? dayjs(value.value.toString(), 'YYYY-MM-DD HH:mm:ss') : undefined} onChange={onChange? (v) => onChange({ _class: type, value: v ? v.format('YYYY-MM-DD HH:mm:ss') : undefined }): undefined} />
    if (type === 'Int' || type === 'Long' || type === 'Double')
      return <InputNumber style={{ width: width }} disabled={disabled} value={value?.value ? +value.value : undefined} onChange={onChange? (v) => onChange({ _class: type, value: v ? v : undefined }): undefined} />
    else
      return <Input style={{ width: width }} disabled={disabled} value={value?.value ? value.value.toString() : undefined} onChange={onChange? (v) => onChange({ _class: type || 'String', value: v ? v.target.value : undefined }): undefined} />
  }

}
