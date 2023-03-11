import { SolidApexCharts } from 'solid-apexcharts';
import { chartData } from './ChartData';

const Chart = () => {
  return (
    <SolidApexCharts type="line" options={chartData()} series={[]} />
  )
};

export default Chart;
