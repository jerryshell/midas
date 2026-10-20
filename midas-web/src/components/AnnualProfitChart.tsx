import * as echarts from "echarts";
import { createEffect, createSignal, onCleanup } from "solid-js";
import IAnnualProfit from "../interfaces/IAnnualProfit";

const AnnualProfitChart = (props: { annualProfitList: IAnnualProfit[] }) => {
  let chartRef = undefined as HTMLDivElement | undefined;

  const [annualProfitChart, setAnnualProfitChart] = createSignal<echarts.ECharts | null>(null);

  createEffect(() => {
    if (!chartRef) return;
    const chart = echarts.init(chartRef, "dark");
    setAnnualProfitChart(chart);
    const resize = () => chart.resize();
    window.addEventListener("resize", resize);
    onCleanup(() => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    });
  });

  createEffect(() => {
    const list = props.annualProfitList;
    if (list.length === 0) return;
    annualProfitChart()?.setOption(
      {
        backgroundColor: "transparent",
        animation: false,
        title: {
          text: "年度收益分布",
          left: 8,
          textStyle: { fontSize: 13 },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          valueFormatter: (value: number) =>
            Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 }),
        },
        legend: {
          data: ["指数收益", "均线收益"],
          top: 0,
        },
        grid: {
          left: 55,
          right: 70,
          top: 45,
          bottom: 20,
        },
        dataZoom: [
          {
            type: "inside",
            yAxisIndex: 0,
          },
          {
            type: "slider",
            yAxisIndex: 0,
            right: 8,
            width: 18,
            showDetail: false,
          },
        ],
        xAxis: [
          {
            type: "value",
          },
        ],
        yAxis: [
          {
            type: "category",
            axisTick: {
              show: false,
            },
            data: list.map((item) => item.year),
          },
        ],
        series: [
          {
            name: "指数收益",
            type: "bar",
            barMaxWidth: 10,
            emphasis: {
              focus: "series",
            },
            data: list.map((item) => item.indexProfit.toFixed(2)),
          },
          {
            name: "均线收益",
            type: "bar",
            barMaxWidth: 10,
            emphasis: {
              focus: "series",
            },
            data: list.map((item) => item.maProfit.toFixed(2)),
          },
        ],
      },
      true,
    );
  });

  return <div class="chart tall" role="img" aria-label="年度收益分布图" ref={chartRef}></div>;
};

export default AnnualProfitChart;
