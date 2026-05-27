import { createSignal } from "solid-js";
import { currentIndexCode, setSimulateResult } from "../GlobalSignal";
import simulateApi from "../api/simulateApi";

interface SimulateFormState {
  code: string;
  initCash: number;
  maDays: number;
  sellRatio: number;
  buyRatio: number;
  serviceCharge: number;
  dateBegin: string;
  dateEnd: string;
}

const SimulateForm = () => {
  const [initCash, setInitCash] = createSignal(1000.0);
  const [maDays, setMaDays] = createSignal(60);
  const [sellRatio, setSellRatio] = createSignal(0.95);
  const [buyRatio, setBuyRatio] = createSignal(1.05);
  const [serviceCharge, setServiceCharge] = createSignal(0.01);
  const [dateBegin, setDateBegin] = createSignal("");
  const [dateEnd, setDateEnd] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const fetchSimulateResult = async (code: string) => {
    setLoading(true);
    const postData: SimulateFormState = {
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
      .then((data) => {
        setSimulateResult(data);
      })
      .catch((e) => {
        alert(e.response?.data ?? e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubmit = () => {
    if (loading()) return;
    const code = currentIndexCode()?.code;
    if (code) {
      fetchSimulateResult(code);
    }
  };

  return (
    <>
      <div style={{ display: "flex" }}>
        <div>
          <label>
            <span>初始现金</span>
            <input
              type="number"
              value={initCash()}
              onChange={(e) => setInitCash(e.currentTarget.valueAsNumber)}
            />
          </label>
        </div>
        <div>
          <label>
            <span>MA</span>
            <input
              type="number"
              value={maDays()}
              onChange={(e) => setMaDays(e.currentTarget.valueAsNumber)}
            />
          </label>
        </div>
        <div>
          <label>
            <span>服务费率</span>
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
            <span>买入阈值</span>
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
            <span>卖出阈值</span>
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
            <span>开始日期</span>
            <input
              type="date"
              value={dateBegin()}
              onChange={(e) => setDateBegin(e.currentTarget.value)}
            />
          </label>
        </div>
        <div>
          <label>
            <span>结束日期</span>
            <input
              type="date"
              value={dateEnd()}
              onChange={(e) => setDateEnd(e.currentTarget.value)}
            />
          </label>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading()}>
        {loading() ? "加载中..." : "回测模拟"}
      </button>
    </>
  );
};

export default SimulateForm;
