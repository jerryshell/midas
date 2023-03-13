import * as echarts from "echarts";
import { createEffect, createSignal } from "solid-js";
import IAnuualProfit from "../interfaces/IAnnualProfit";

const AnnualProfitChart = (props: { annualProfitList: IAnuualProfit[] }) => {
  let chartRef: HTMLDivElement;

  const [annualProfitChart, setAnnualProfitChart] =
    createSignal<echarts.ECharts | null>(null);
  createEffect(() => {
    setAnnualProfitChart(echarts.init(chartRef, "dark"));
  });
  createEffect(() => {
    annualProfitChart()?.setOption({
      backgroundColor: "black",
      title: {
        text: "收益分布",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      legend: {
        data: ["指数收益", "均线收益"],
      },
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
          data: props.annualProfitList.map((item) => item.year),
        },
      ],
      series: [
        {
          name: "指数收益",
          type: "bar",
          label: {
            show: true,
            position: "right",
          },
          emphasis: {
            focus: "series",
          },
          data: props.annualProfitList.map((item) =>
            item.indexProfit.toFixed(2)
          ),
        },
        {
          name: "均线收益",
          type: "bar",
          label: {
            show: true,
            position: "right",
          },
          emphasis: {
            focus: "series",
          },
          data: props.annualProfitList.map((item) => item.maProfit.toFixed(2)),
        },
      ],
    });
  });

  return (
    <div>
      <div style={{ height: "1200px" }} ref={chartRef!}></div>
    </div>
  );
};

export default AnnualProfitChart;
