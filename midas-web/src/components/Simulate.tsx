import { createEffect, Show } from "solid-js";
import {
  appMode,
  currentIndexCode,
  indexCodeList,
  setAppMode,
  setCurrentIndexCode,
  simulateResult,
} from "../GlobalSignal";
import { SIMPLE_INDEX_CODES } from "../config";
import AnnualProfitChart from "./AnnualProfitChart";
import ProfitChart from "./ProfitChart";
import ProfitOverview from "./ProfitOverview";
import SimpleMode from "./SimpleMode";
import SimulateForm from "./SimulateForm";
import TradeDetailTable from "./TradeDetailTable";
import TradeOverview from "./TradeOverview";

const Simulate = () => {
  createEffect(() => {
    if (appMode() !== "simple") return;
    const code = currentIndexCode()?.code;
    if (code && (SIMPLE_INDEX_CODES as readonly string[]).includes(code)) return;
    const first = indexCodeList().find((item) =>
      (SIMPLE_INDEX_CODES as readonly string[]).includes(item.code),
    );
    if (first) setCurrentIndexCode(first);
  });

  return (
    <fieldset>
      <legend>策略跟盘</legend>
      <div class="mode-switch">
        <button
          type="button"
          classList={{ active: appMode() === "simple" }}
          onClick={() => setAppMode("simple")}
        >
          简单跟盘
        </button>
        <button
          type="button"
          classList={{ active: appMode() === "research" }}
          onClick={() => setAppMode("research")}
        >
          研究回测
        </button>
      </div>

      <Show when={appMode() === "simple"}>
        <SimpleMode />
      </Show>

      <Show when={appMode() === "research"}>
        <SimulateForm />
        <Show when={simulateResult()}>
          <ProfitChart profitList={simulateResult()!.profitList} />
          <ProfitOverview simulateResult={simulateResult()!} />
          <AnnualProfitChart annualProfitList={simulateResult()!.annualProfitList} />
          <TradeOverview tradeList={simulateResult()!.tradeList} />
          <TradeDetailTable tradeList={simulateResult()!.tradeList} />
        </Show>
      </Show>
    </fieldset>
  );
};

export default Simulate;
