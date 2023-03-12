import * as echarts from 'echarts'
import { createEffect, createSignal } from 'solid-js'
import IProfitData from './interfaces/IProfitData'

const ProfitDataChart = (props: { profitDataList: IProfitData[] }) => {
  let chartRef: HTMLDivElement

  const [profitDataChart, setProfitDataChart] = createSignal<echarts.ECharts | null>(null)
  createEffect(() => {
    setProfitDataChart(echarts.init(chartRef, 'dark'))
  })
  createEffect(() => {
    profitDataChart()?.setOption({
      title: {
        text: '回测模拟'
      },
      legend: {
        data: ['回测模拟', '收盘价'],
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: false
          },
          brush: {
            type: ['lineX', 'clear']
          }
        }
      },
      dataZoom: [
        {
          type: 'inside',
        },
        {
          show: true,
        }
      ],
      xAxis: {
        type: 'category',
        data: props.profitDataList.map(item => item.date)
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '收盘价',
          type: 'line',
          data: props.profitDataList.map(item => item.closePoint)
        },
        {
          name: '回测模拟',
          type: 'line',
          data: props.profitDataList.map(item => item.value)
        }
      ]
    })
  })

  return (
    <div style="width: 100%; height:400px;" ref={chartRef!}></div>
  )
}

export default ProfitDataChart
