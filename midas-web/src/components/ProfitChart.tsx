import * as echarts from "echarts";
import { createEffect, createSignal, onCleanup } from "solid-js";
import IProfit from "../interfaces/IProfit";

const ProfitChart = (props: { profitList: IProfit[] }) => {
  let chartRef = undefined as HTMLDivElement | undefined;

  const [profitChart, setProfitChart] = createSignal<echarts.ECharts | null>(null);

  createEffect(() => {
    if (!chartRef) return;
    const chart = echarts.init(chartRef, "dark");
    setProfitChart(chart);
    const resize = () => chart.resize();
    window.addEventListener("resize", resize);
    onCleanup(() => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    });
  });

  createEffect(() => {
    const list = props.profitList;
    if (list.length === 0) return;
    const closeBase = list[0].closePoint || 1;
    const valueBase = list[0].value || 1;

    profitChart()?.setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        legend: {
          data: ["指数净值", "策略净值"],
          top: 0,
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
          },
        },
        grid: {
          left: 55,
          right: 25,
          top: 45,
          bottom: 60,
        },
        toolbox: {
          feature: {
            dataZoom: {
              yAxisIndex: false,
            },
            saveAsImage: {},
          },
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
          name: "净值",
          scale: true,
        },
        series: [
          {
            name: "指数净值",
            type: "line",
            showSymbol: false,
            data: list.map((item) => ((item.closePoint / closeBase) * 100).toFixed(2)),
          },
          {
            name: "策略净值",
            type: "line",
            showSymbol: false,
            data: list.map((item) => ((item.value / valueBase) * 100).toFixed(2)),
          },
        ],
      },
      true,
    );
  });

  return <div class="chart" ref={chartRef}></div>;
};

export default ProfitChart;
