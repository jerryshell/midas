import { createSignal } from "solid-js";
import { ApexOptions } from "apexcharts";

const [profitDataChartOptions, setProfitDataChartOptions] = createSignal<ApexOptions>({
  theme: {
    mode: 'dark',
    palette: 'palette1',
  },
})

export { profitDataChartOptions, setProfitDataChartOptions }
