import * as echarts from "echarts";
import { createEffect, createSignal, onCleanup } from "solid-js";
import IIndexData from "../interfaces/IIndexData";

const IndexDataChart = (props: { indexDataList: IIndexData[] }) => {
  let chartRef = undefined as HTMLDivElement | undefined;

  const [indexDataChart, setIndexDataChart] = createSignal<echarts.ECharts | null>(null);

  createEffect(() => {
    if (!chartRef) return;
    const chart = echarts.init(chartRef, "dark");
    setIndexDataChart(chart);
    const resize = () => chart.resize();
    window.addEventListener("resize", resize);
    onCleanup(() => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    });
  });

  createEffect(() => {
    const list = props.indexDataList;
    if (list.length === 0) return;
    indexDataChart()?.setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        title: {
          text: "指数收盘价",
          left: 8,
          textStyle: { fontSize: 13 },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
          },
        },
        toolbox: {
          feature: {
            dataZoom: {
              yAxisIndex: false,
            },
          },
        },
        grid: {
          left: 55,
          right: 20,
          top: 45,
          bottom: 60,
        },
        dataZoom: [
          {
            type: "inside",
          },
          {
            show: true,
            bottom: 10,
          },
        ],
        xAxis: {
          data: list.map((item) => item.date),
          boundaryGap: false,
        },
        yAxis: {
          type: "value",
          scale: true,
        },
        series: [
          {
            name: "收盘价",
            type: "line",
            showSymbol: false,
            data: list.map((item) => item.closePoint),
          },
        ],
      },
      true,
    );
  });

  return <div class="chart" ref={chartRef}></div>;
};

export default IndexDataChart;
