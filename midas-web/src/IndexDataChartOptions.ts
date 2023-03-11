import { createSignal } from "solid-js";
import { ApexOptions } from "apexcharts";

const [indexDataChartOptions, setIndexDataChartOptions] = createSignal<ApexOptions>({})

export { indexDataChartOptions, setIndexDataChartOptions }
