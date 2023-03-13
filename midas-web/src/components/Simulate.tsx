import { createSignal, Show } from "solid-js";
import simulateApi from "../api/simulateApi";
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
  const [sellRatio, setSellRatio] = createSignal(0.95);
  const [buyRatio, setBuyRatio] = createSignal(1.05);
  const [serviceCharge, setServiceCharge] = createSignal(0.01);
  const [dateBegin, setDateBegin] = createSignal("");
  const [dateEnd, setDateEnd] = createSignal("");

  const fetchSimulateResult = async (code: string) => {
    const postData = {
      code,
      initCash: initCash(),
      maDays: maDays(),
      sellRatio: sellRatio(),
      buyRatio: buyRatio(),
      serviceCharge: serviceCharge(),
      dateBegin: dateBegin(),
      dateEnd: dateEnd(),
    };

    return simulateApi
      .simulate(postData)
      .then((response) => {
        setSimulateResult(response.data);
      })
      .catch((e) => {
        alert(e.response.data);
      });
  };

  const handleSimulateBtnClick = () => {
    const code = currentIndexCode()?.code;
    if (code) {
      fetchSimulateResult(code);
    }
  };

  return (
    <fieldset>
      <legend>回测模拟</legend>

      <div style={{ display: "flex" }}>
        <div>
          <label>
            初始现金
            <input
              type="number"
              value={initCash()}
              onChange={(e) => setInitCash(e.currentTarget.valueAsNumber)}
            />
          </label>
        </div>
        <div>
          <label>
            MA
            <input
              type="number"
              value={maDays()}
              onChange={(e) => setMaDays(e.currentTarget.valueAsNumber)}
            />
          </label>
        </div>
        <div>
          <label>
            服务费率
            <input
              step="0.01"
              type="number"
              value={serviceCharge()}
              onChange={(e) => setServiceCharge(e.currentTarget.valueAsNumber)}
            />
          </label>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <div>
          <label>
            买入阈值
            <input
              step="0.01"
              type="number"
              value={buyRatio()}
              onChange={(e) => setBuyRatio(e.currentTarget.valueAsNumber)}
            />
          </label>
        </div>
        <div>
          <label>
            卖出阈值
            <input
              step="0.01"
              type="number"
              value={sellRatio()}
              onChange={(e) => setSellRatio(e.currentTarget.valueAsNumber)}
            />
          </label>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        <div>
          <label>
            开始日期
            <input
              type="date"
              value={dateBegin()}
              onChange={(e) => setDateBegin(e.currentTarget.value)}
            />
          </label>
        </div>
        <div>
          <label>
            结束日期
            <input
              type="date"
              value={dateEnd()}
              onChange={(e) => setDateEnd(e.currentTarget.value)}
            />
          </label>
        </div>
      </div>

      <button onClick={handleSimulateBtnClick}>回测模拟</button>

      <Show when={simulateResult()}>
        <ProfitChart profitList={simulateResult()!.profitList} />
      </Show>
      <Show when={simulateResult()}>
        <ProfitOverview simulateResult={simulateResult()!} />
      </Show>
      <Show when={simulateResult()}>
        <TradeOverview tradeList={simulateResult()!.tradeList} />
      </Show>
      <Show when={simulateResult()}>
        <TradeDetailTable tradeList={simulateResult()!.tradeList} />
      </Show>
    </fieldset>
  );
};

export default Simulate;
