<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MessageType } from '@/types/base'
import { getMessageTypeName } from '@/types/base'
import type { HourlyActivity, WeekdayActivity, MonthlyActivity } from '@/types/analysis'
import { EChartPie, EChartBar, EChartHeatmap } from '@/components/charts'
import type { EChartPieData, EChartBarData, EChartHeatmapData } from '@/components/charts'
import { SectionCard } from '@/components/UI'

const { t } = useI18n()

interface TimeFilter {
  startTs?: number
  endTs?: number
}

// Props
const props = defineProps<{
  sessionId: string
  timeFilter?: TimeFilter
}>()

// 数据状态
const isLoading = ref(true)
const messageTypes = ref<Array<{ type: MessageType; count: number }>>([])
const hourlyActivity = ref<HourlyActivity[]>([])
const weekdayActivity = ref<WeekdayActivity[]>([])
const monthlyActivity = ref<MonthlyActivity[]>([])
const yearlyActivity = ref<Array<{ year: number; messageCount: number }>>([])

// 星期名称（按 1=周一 到 7=周日 的顺序）
const weekdayNames = computed(() => [
  t('weekdays.mon'),
  t('weekdays.tue'),
  t('weekdays.wed'),
  t('weekdays.thu'),
  t('weekdays.fri'),
  t('weekdays.sat'),
  t('weekdays.sun'),
])

// 月份名称
const monthNames = computed(() => [
  t('months.jan'),
  t('months.feb'),
  t('months.mar'),
  t('months.apr'),
  t('months.may'),
  t('months.jun'),
  t('months.jul'),
  t('months.aug'),
  t('months.sep'),
  t('months.oct'),
  t('months.nov'),
  t('months.dec'),
])

// 消息类型饼图数据
const typeChartData = computed<EChartPieData>(() => {
  // 按数量排序
  const sorted = [...messageTypes.value].sort((a, b) => b.count - a.count)
  return {
    labels: sorted.map((t) => getMessageTypeName(t.type)),
    values: sorted.map((t) => t.count),
  }
})

// 小时分布图表数据
const hourlyChartData = computed<EChartBarData>(() => {
  // 补全 24 小时数据
  const hourMap = new Map(hourlyActivity.value.map((h) => [h.hour, h.messageCount]))
  const labels: string[] = []
  const values: number[] = []

  for (let i = 0; i < 24; i++) {
    labels.push(`${i}`)
    values.push(hourMap.get(i) || 0)
  }

  return { labels, values }
})

// 星期分布图表数据
const weekdayChartData = computed<EChartBarData>(() => {
  // 补全 7 天数据（weekday: 1=周一, 2=周二, ..., 7=周日）
  const dayMap = new Map(weekdayActivity.value.map((w) => [w.weekday, w.messageCount]))
  const values: number[] = []

  // 按周一到周日的顺序（1-7）
  for (let i = 1; i <= 7; i++) {
    values.push(dayMap.get(i) || 0)
  }

  return {
    labels: weekdayNames.value,
    values,
  }
})

// 月份分布图表数据
const monthlyChartData = computed<EChartBarData>(() => {
  // 补全 12 个月数据
  const monthMap = new Map(monthlyActivity.value.map((m) => [m.month, m.messageCount]))
  const values: number[] = []

  for (let i = 1; i <= 12; i++) {
    values.push(monthMap.get(i) || 0)
  }

  return {
    labels: monthNames.value,
    values,
  }
})

// 年份分布图表数据
const yearlyChartData = computed<EChartBarData>(() => {
  // 按年份排序
  const sorted = [...yearlyActivity.value].sort((a, b) => a.year - b.year)
  return {
    labels: sorted.map((y) => String(y.year)),
    values: sorted.map((y) => y.messageCount),
  }
})

// 热力图数据（小时 x 星期）- 转换为 ECharts 热力图格式
const heatmapChartData = computed<EChartHeatmapData>(() => {
  // X 轴：24 小时
  const xLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  // Y 轴：周一到周日
  const yLabels = weekdayNames.value

  // 计算总消息数用于归一化
  const total = messageTypes.value.reduce((sum, t) => sum + t.count, 0) || 1

  // 数据格式：[x索引, y索引, 值]
  const data: Array<[number, number, number]> = []

  // 按周一(1)到周日(7)的顺序生成数据
  for (let day = 1; day <= 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // 使用现有数据估算：星期数据 * 小时数据 / 总数
      const dayCount = weekdayActivity.value.find((w) => w.weekday === day)?.messageCount || 0
      const hourCount = hourlyActivity.value.find((h) => h.hour === hour)?.messageCount || 0
      const value = Math.round((dayCount * hourCount) / total)
      data.push([hour, day - 1, value])
    }
  }

  return { xLabels, yLabels, data }
})

// 加载数据
async function loadData() {
  if (!props.sessionId) return

  isLoading.value = true
  try {
    const [types, hourly, weekday, monthly, yearly] = await Promise.all([
      window.chatApi.getMessageTypeDistribution(props.sessionId, props.timeFilter),
      window.chatApi.getHourlyActivity(props.sessionId, props.timeFilter),
      window.chatApi.getWeekdayActivity(props.sessionId, props.timeFilter),
      window.chatApi.getMonthlyActivity(props.sessionId, props.timeFilter),
      window.chatApi.getYearlyActivity(props.sessionId, props.timeFilter),
    ])

    messageTypes.value = types
    hourlyActivity.value = hourly
    weekdayActivity.value = weekday
    monthlyActivity.value = monthly
    yearlyActivity.value = yearly
  } catch (error) {
    console.error('加载消息视图数据失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 监听 props 变化
watch(
  () => [props.sessionId, props.timeFilter],
  () => {
    loadData()
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="main-content space-y-6 p-6">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-gray-400" />
    </div>

    <template v-else>
      <!-- 消息类型分布 -->
      <SectionCard :title="t('typeDistribution')" :show-divider="false">
        <div class="p-5">
          <EChartPie v-if="typeChartData.values.length > 0" :data="typeChartData" :height="280" />
          <div v-else class="flex h-48 items-center justify-center text-gray-400">
            {{ t('noData') }}
          </div>
        </div>
      </SectionCard>

      <!-- 时间分布图表（小时 & 星期） -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- 小时分布 -->
        <SectionCard :title="t('hourlyDistribution')" :show-divider="false">
          <div class="p-5">
            <EChartBar :data="hourlyChartData" :height="200" />
          </div>
        </SectionCard>

        <!-- 星期分布 -->
        <SectionCard :title="t('weekdayDistribution')" :show-divider="false">
          <div class="p-5">
            <EChartBar :data="weekdayChartData" :height="200" />
          </div>
        </SectionCard>
      </div>

      <!-- 时间分布图表（月份 & 年份） -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- 月份分布 -->
        <SectionCard :title="t('monthlyDistribution')" :show-divider="false">
          <div class="p-5">
            <EChartBar :data="monthlyChartData" :height="200" />
          </div>
        </SectionCard>

        <!-- 年份分布 -->
        <SectionCard :title="t('yearlyDistribution')" :show-divider="false">
          <div class="p-5">
            <EChartBar
              v-if="yearlyChartData.values.length > 0"
              :data="yearlyChartData"
              :height="200"
            />
            <div v-else class="flex h-48 items-center justify-center text-gray-400">
              {{ t('noData') }}
            </div>
          </div>
        </SectionCard>
      </div>

      <!-- 时间热力图 -->
      <SectionCard :title="t('timeHeatmap')" :show-divider="false">
        <template #headerRight>
          <span class="text-xs text-gray-400">{{ t('heatmapHint') }}</span>
        </template>
        <div class="p-5">
          <EChartHeatmap :data="heatmapChartData" :height="320" />
        </div>
      </SectionCard>

      <!-- 消息长度分布 (占位) -->
      <SectionCard :title="t('lengthDistribution')" :show-divider="false">
        <div class="flex h-48 items-center justify-center">
          <div class="text-center">
            <UIcon name="i-heroicons-chart-bar" class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p class="mt-2 text-sm text-gray-400">{{ t('comingSoon') }}</p>
          </div>
        </div>
      </SectionCard>

      <!-- 双方类型对比 (占位) -->
      <SectionCard :title="t('memberTypeComparison')" :show-divider="false">
        <div class="flex h-48 items-center justify-center">
          <div class="text-center">
            <UIcon name="i-heroicons-user-group" class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p class="mt-2 text-sm text-gray-400">{{ t('comingSoon') }}</p>
          </div>
        </div>
      </SectionCard>
    </template>
  </div>
</template>

<i18n>
{
  "zh-CN": {
    "typeDistribution": "消息类型分布",
    "hourlyDistribution": "小时分布",
    "weekdayDistribution": "星期分布",
    "monthlyDistribution": "月份分布",
    "yearlyDistribution": "年份分布",
    "timeHeatmap": "时间热力图",
    "heatmapHint": "展示聊天时间规律",
    "lengthDistribution": "消息长度分布",
    "memberTypeComparison": "双方类型对比",
    "noData": "暂无数据",
    "comingSoon": "功能开发中...",
    "weekdays": {
      "sun": "周日",
      "mon": "周一",
      "tue": "周二",
      "wed": "周三",
      "thu": "周四",
      "fri": "周五",
      "sat": "周六"
    },
    "months": {
      "jan": "1月",
      "feb": "2月",
      "mar": "3月",
      "apr": "4月",
      "may": "5月",
      "jun": "6月",
      "jul": "7月",
      "aug": "8月",
      "sep": "9月",
      "oct": "10月",
      "nov": "11月",
      "dec": "12月"
    }
  },
  "en-US": {
    "typeDistribution": "Message Type Distribution",
    "hourlyDistribution": "Hourly Distribution",
    "weekdayDistribution": "Weekday Distribution",
    "monthlyDistribution": "Monthly Distribution",
    "yearlyDistribution": "Yearly Distribution",
    "timeHeatmap": "Time Heatmap",
    "heatmapHint": "Shows chat time patterns",
    "lengthDistribution": "Message Length Distribution",
    "memberTypeComparison": "Member Type Comparison",
    "noData": "No data",
    "comingSoon": "Coming soon...",
    "weekdays": {
      "sun": "Sun",
      "mon": "Mon",
      "tue": "Tue",
      "wed": "Wed",
      "thu": "Thu",
      "fri": "Fri",
      "sat": "Sat"
    },
    "months": {
      "jan": "Jan",
      "feb": "Feb",
      "mar": "Mar",
      "apr": "Apr",
      "may": "May",
      "jun": "Jun",
      "jul": "Jul",
      "aug": "Aug",
      "sep": "Sep",
      "oct": "Oct",
      "nov": "Nov",
      "dec": "Dec"
    }
  }
}
</i18n>
