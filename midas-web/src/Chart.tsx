import { SolidApexCharts } from 'solid-apexcharts';
import { chartData } from './ChartData';

const Chart = () => {
  return (
    <SolidApexCharts options={chartData()} series={[]} type="line" />
  )
};

export default Chart;
