import * as echarts from "echarts";
import { createEffect, createSignal } from "solid-js";
import IProfit from "../interfaces/IProfit";

const ProfitChart = (props: { profitList: IProfit[] }) => {
  let chartRef: HTMLDivElement;

  const [profitChart, setProfitChart] = createSignal<echarts.ECharts | null>(
    null
  );
  createEffect(() => {
    setProfitChart(echarts.init(chartRef, "dark"));
  });
  createEffect(() => {
    profitChart()?.setOption({
      backgroundColor: "black",
      legend: {
        data: ["收盘价", "回测模拟"],
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
      dataZoom: [
        {
          type: "inside",
        },
        {
          show: true,
        },
      ],
      xAxis: {
        data: props.profitList.map((item) => item.date),
      },
      yAxis: {},
      series: [
        {
          name: "收盘价",
          type: "line",
          data: props.profitList.map((item) => item.closePoint),
        },
        {
          name: "回测模拟",
          type: "line",
          data: props.profitList.map((item) => item.value),
        },
      ],
    });
  });

  return <div style={{ height: "500px" }} ref={chartRef!}></div>;
};

export default ProfitChart;
