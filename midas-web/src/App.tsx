import { Component, createEffect, createSignal, For, Show } from "solid-js";
import api from "./api/api";
import IndexDataChart from "./components/IndexDataChart";
import ProfitChart from "./components/Profitchart";
import ProfitOverview from "./components/ProfitOverview";
import TradeDetailTable from "./components/TradeDetailTable";
import TradeOverview from "./components/TradeOverview";
import IIndexCode from "./interfaces/IIndexCode";
import IIndexData from "./interfaces/IIndexData";
import ISimulateResult from "./interfaces/ISimulateResult";

const App: Component = () => {
  const [indexCodeList, setIndexCodeList] = createSignal([] as IIndexCode[]);
  const [indexDataList, setIndexDataList] = createSignal([] as IIndexData[]);
  const [currentIndexCode, setCurrentIndexCode] = createSignal(
    {} as IIndexCode
  );
  const [simulateResult, setSimulateResult] = createSignal(
    {} as ISimulateResult
  );
  const [initCash, setInitCash] = createSignal(1000.0);
  const [maDays, setMadays] = createSignal(60);
  const [sellRate, setSellRate] = createSignal(0.95);
  const [buyRate, setBuyRate] = createSignal(1.05);
  const [serviceCharge, setServiceCharge] = createSignal(0.01);
  const [dateBegin, setDateBegin] = createSignal<string | undefined>(undefined);
  const [dateEnd, setDateEnd] = createSignal<string | undefined>(undefined);

  const fetchIndexCodeList = async () => {
    return api.get("/indexCode/list").then((response) => {
      console.log("fetchIndexCodeList() response", response);
      setIndexCodeList(response.data);
    });
  };

  const fetchIndexDataList = async (code: string) => {
    return api.get(`/indexData/list/${code}`).then((response) => {
      console.log("fetchIndexDataList() response", response);
      setIndexDataList(response.data);
    });
  };

  const fetchSimulateResult = async (code: string) => {
    const postData = {
      code,
      initCash: initCash(),
      maDays: maDays(),
      sellRate: sellRate(),
      buyRate: buyRate(),
      serviceCharge: serviceCharge(),
      dateBegin: dateBegin() || undefined,
      dateEnd: dateEnd() || undefined,
    };

    return api.post(`/simulate`, postData).then((response) => {
      console.log("fetchSimulateResult() response", response);
      setSimulateResult(response.data);
    });
  };

  createEffect(() => {
    fetchIndexCodeList().then(() => {
      setCurrentIndexCode(indexCodeList()[0]);
    });
  });

  createEffect(() => {
    const code = currentIndexCode().code;
    if (code) {
      fetchIndexDataList(code);
    }
  });

  const handleSimulateBtnClick = () => {
    const code = currentIndexCode().code;
    if (code) {
      fetchSimulateResult(code);
    }
  };

  const handleSelectChange = (code: string) => {
    const indexCode = indexCodeList().find((item) => item.code === code);
    if (indexCode) {
      setCurrentIndexCode(indexCode);
    }
  };

  return (
    <div>
      <h1>Midas</h1>
      <p>
        ⚠️
        本项目仅供交流编程技术使用，不对任何人构成投资建议，投资有风险，入市需谨慎！
      </p>

      <fieldset>
        <legend>选择指数</legend>
        <select onChange={(e) => handleSelectChange(e.currentTarget.value)}>
          <For each={indexCodeList()} fallback={<div>Loading...</div>}>
            {(item) => (
              <option
                value={item.code}
                selected={item.code === currentIndexCode().code}
              >{`${item.code}-${item.name}`}</option>
            )}
          </For>
        </select>
        <Show when={indexDataList().length > 0}>
          <IndexDataChart indexDataList={indexDataList()} />
        </Show>
      </fieldset>

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
              onChange={(e) => setMadays(e.currentTarget.valueAsNumber)}
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

      <div>
        <span>Author: </span>
        <a href="https://github.com/jerryshell" target="_blank">
          @jerryshell
        </a>
      </div>
    </div>
  );
};

export default App;
