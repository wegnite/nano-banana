/**
 * Dayjs 全局配置
 * 配置插件以兼容 moment.js 的功能
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/zh-cn';

// 扩展插件
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(duration);

// 设置默认语言
dayjs.locale('en');

export default dayjs;
