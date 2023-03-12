import * as echarts from 'echarts'
import { createEffect, createSignal } from 'solid-js'
import IIndexData from './interfaces/IIndexData'

const IndexDataChart = (props: { indexDataList: IIndexData[] }) => {
  let chartRef: HTMLDivElement

  const [indexDataChart, setIndexDataChart] = createSignal<echarts.ECharts | null>(null)
  createEffect(() => {
    setIndexDataChart(echarts.init(chartRef, 'dark'))
  })
  createEffect(() => {
    indexDataChart()?.setOption({
      backgroundColor: 'black',
      title: {
        text: '指数收盘价'
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
        data: props.indexDataList.map(item => item.date)
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '收盘价',
          type: 'line',
          data: props.indexDataList.map(item => item.closePoint)
        }
      ]
    })
  })

  return (
    <div style="width: 100%; height:400px;" ref={chartRef!}></div>
  )
}

export default IndexDataChart
