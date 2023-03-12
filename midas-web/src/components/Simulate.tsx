import { createSignal, Show } from "solid-js";
import api from "../api/api";
import {
  currentIndexCode,
  setSimulateResult,
  simulateResult,
} from "../GlobalSignal";
import ProfitChart from "./Profitchart";
import ProfitOverview from "./ProfitOverview";
import TradeDetailTable from "./TradeDetailTable";
import TradeOverview from "./TradeOverview";

const Simulate = () => {
  const [initCash, setInitCash] = createSignal(1000.0);
  const [maDays, setMaDays] = createSignal(60);
  const [sellRate, setSellRate] = createSignal(0.95);
  const [buyRate, setBuyRate] = createSignal(1.05);
  const [serviceCharge, setServiceCharge] = createSignal(0.01);
  const [dateBegin, setDateBegin] = createSignal("");
  const [dateEnd, setDateEnd] = createSignal("");

  const fetchSimulateResult = async (code: string) => {
    const postData = {
      code,
      initCash: initCash(),
      maDays: maDays(),
      sellRate: sellRate(),
      buyRate: buyRate(),
      serviceCharge: serviceCharge(),
      dateBegin: dateBegin(),
      dateEnd: dateEnd(),
    };

    return api.post(`/simulate`, postData).then((response) => {
      console.log("fetchSimulateResult() response", response);
      setSimulateResult(response.data);
    });
  };

  const handleSimulateBtnClick = () => {
    const code = currentIndexCode().code;
    if (code) {
      fetchSimulateResult(code);
    }
  };

  return (
    <fieldset>
      <legend>回测模拟</legend>

      <div style={{ display: "flex" }}>
        <div>
          <label for="initCashInput">初始现金</label>
          <input
            id="initCashInput"
            type="number"
            value={initCash()}
            onChange={(e) => setInitCash(e.currentTarget.valueAsNumber)}
          />
        </div>
        <div>
          <label for="maInput">移动均线</label>
          <input
            id="maInput"
            type="number"
            value={maDays()}
            onChange={(e) => setMaDays(e.currentTarget.valueAsNumber)}
          />
        </div>
        <div>
          <label for="serviceChargeInput">服务费率</label>
          <input
            id="serviceChargeInput"
            step="0.01"
            type="number"
            value={serviceCharge()}
            onChange={(e) => setServiceCharge(e.currentTarget.valueAsNumber)}
          />
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <div>
          <label for="buyRateInput">买入阈值</label>
          <input
            id="buyRateInput"
            step="0.01"
            type="number"
            value={buyRate()}
            onChange={(e) => setBuyRate(e.currentTarget.valueAsNumber)}
          />
        </div>
        <div>
          <label for="sellRateInput">卖出阈值</label>
          <input
            id="sellRateInput"
            step="0.01"
            type="number"
            value={sellRate()}
            onChange={(e) => setSellRate(e.currentTarget.valueAsNumber)}
          />
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <div>
          <label for="dateBeginInput">开始日期</label>
          <input
            id="dateBeginInput"
            type="date"
            value={dateBegin()}
            onChange={(e) => setDateBegin(e.currentTarget.value)}
          />
        </div>
        <div>
          <label for="dateEndInput">结束日期</label>
          <input
            id="dateEndInput"
            type="date"
            value={dateEnd()}
            onChange={(e) => setDateEnd(e.currentTarget.value)}
          />
        </div>
      </div>

      <button onClick={handleSimulateBtnClick}>回测模拟</button>
      <Show when={simulateResult().profitList}>
        <ProfitChart profitList={simulateResult().profitList} />
      </Show>
      <Show when={simulateResult().years}>
        <ProfitOverview simulateResult={simulateResult()} />
      </Show>
      <Show when={simulateResult().tradeList}>
        <TradeOverview tradeList={simulateResult().tradeList} />
      </Show>
      <Show when={simulateResult().tradeList}>
        <TradeDetailTable tradeList={simulateResult().tradeList} />
      </Show>
    </fieldset>
  );
};

export default Simulate;
