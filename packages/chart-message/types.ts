/**
 * chart-message 插件本地类型定义
 */

/** 消息类型枚举 */
export enum MessageType {
  TEXT = 0,
  IMAGE = 1,
  VOICE = 2,
  VIDEO = 3,
  FILE = 4,
  EMOJI = 5,
  LINK = 6,
  LOCATION = 7,
  RED_PACKET = 20,
  TRANSFER = 21,
  POKE = 22,
  CALL = 30,
  SHARE = 31,
  REPLY = 32,
  FORWARD = 33,
  CONTACT = 34,
  SYSTEM = 80,
  RECALL = 81,
  OTHER = 99,
}

/** 消息类型名称映射 */
const MESSAGE_TYPE_NAMES: Record<number, string> = {
  [MessageType.TEXT]: '文字',
  [MessageType.IMAGE]: '图片',
  [MessageType.VOICE]: '语音',
  [MessageType.VIDEO]: '视频',
  [MessageType.FILE]: '文件',
  [MessageType.EMOJI]: '表情',
  [MessageType.LINK]: '链接',
  [MessageType.LOCATION]: '位置',
  [MessageType.RED_PACKET]: '红包',
  [MessageType.TRANSFER]: '转账',
  [MessageType.POKE]: '拍一拍',
  [MessageType.CALL]: '通话',
  [MessageType.SHARE]: '分享',
  [MessageType.REPLY]: '回复',
  [MessageType.FORWARD]: '转发',
  [MessageType.CONTACT]: '名片',
  [MessageType.SYSTEM]: '系统',
  [MessageType.RECALL]: '撤回',
  [MessageType.OTHER]: '其他',
}

/** 获取消息类型名称 */
export function getMessageTypeName(type: MessageType | number): string {
  return MESSAGE_TYPE_NAMES[type] || '未知'
}

/** 小时活跃度 */
export interface HourlyActivity {
  hour: number
  messageCount: number
}

/** 日期活跃度 */
export interface DailyActivity {
  date: string
  messageCount: number
}

/** 星期活跃度 */
export interface WeekdayActivity {
  weekday: number
  messageCount: number
}

/** 月份活跃度 */
export interface MonthlyActivity {
  month: number
  messageCount: number
}

/** 年份活跃度 */
export interface YearlyActivity {
  year: number
  messageCount: number
}

/** 消息类型分布 */
export interface MessageTypeCount {
  type: number
  count: number
}

/** 消息长度分布 */
export interface LengthDistribution {
  detail: Array<{ len: number; count: number }>
  grouped: Array<{ range: string; count: number }>
}
