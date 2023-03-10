import { createSignal } from "solid-js";
import { ApexOptions } from "apexcharts";

const [chartData, setChartData] = createSignal<ApexOptions>({})

export { chartData, setChartData }
