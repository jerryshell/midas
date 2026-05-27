import { Show } from "solid-js";
import { simulateResult } from "../GlobalSignal";
import AnnualProfitChart from "./AnnualProfitChart";
import ProfitChart from "./ProfitChart";
import ProfitOverview from "./ProfitOverview";
import SimulateForm from "./SimulateForm";
import TradeDetailTable from "./TradeDetailTable";
import TradeOverview from "./TradeOverview";

const Simulate = () => {
  return (
    <fieldset>
      <legend>回测模拟</legend>
      <SimulateForm />
      <Show when={simulateResult()}>
        <ProfitChart profitList={simulateResult()!.profitList} />
        <ProfitOverview simulateResult={simulateResult()!} />
        <AnnualProfitChart annualProfitList={simulateResult()!.annualProfitList} />
        <TradeOverview tradeList={simulateResult()!.tradeList} />
        <TradeDetailTable tradeList={simulateResult()!.tradeList} />
      </Show>
    </fieldset>
  );
};

export default Simulate;
