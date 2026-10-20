import { createSignal, Show } from "solid-js";
import { currentIndexCode, setSimulateResult } from "../GlobalSignal";
import simulateApi from "../api/simulateApi";

interface SimulateFormState {
  code: string;
  initCash: number;
  maDays: number;
  sellRatio: number;
  buyRatio: number;
  dateBegin: string;
  dateEnd: string;
  buyServiceCharge: number;
  sellServiceCharge: number;
  slippage: number;
  cashYield: number;
  dividendYield: number;
  executionDelay: number;
  volTarget: number;
  volLookback: number;
  maxLeverage: number;
  marginRate: number;
  rebalanceBand: number;
  strategy: "classic" | "strength";
  strengthFull: number;
  minWeight: number;
  decisionFrequency: "daily" | "weekly" | "monthly";
}

const SimulateForm = () => {
  const [initCash, setInitCash] = createSignal(100000.0);
  const [maDays, setMaDays] = createSignal(30);
  const [sellRatio, setSellRatio] = createSignal(0.95);
  const [buyRatio, setBuyRatio] = createSignal(1.05);
  const [dateBegin, setDateBegin] = createSignal("");
  const [dateEnd, setDateEnd] = createSignal("");

  const [buyServiceCharge, setBuyServiceCharge] = createSignal(0.0003);
  const [sellServiceCharge, setSellServiceCharge] = createSignal(0.0008);
  const [slippage, setSlippage] = createSignal(0.0002);
  const [cashYield, setCashYield] = createSignal(0.02);
  const [dividendYield, setDividendYield] = createSignal(0.02);
  const [executionDelay, setExecutionDelay] = createSignal(1);

  const [volTargetOn, setVolTargetOn] = createSignal(false);
  const [volTarget, setVolTarget] = createSignal(0.2);
  const [volLookback, setVolLookback] = createSignal(20);
  const [maxLeverage, setMaxLeverage] = createSignal(1.0);
  const [marginRate, setMarginRate] = createSignal(0.04);
  const [rebalanceBand, setRebalanceBand] = createSignal(0.05);
  const [strategy, setStrategy] = createSignal<"classic" | "strength">("classic");
  const [strengthFull, setStrengthFull] = createSignal(0.1);
  const [minWeight, setMinWeight] = createSignal(0.2);
  const [decisionFrequency, setDecisionFrequency] = createSignal<"daily" | "weekly" | "monthly">(
    "daily",
  );

  const [loading, setLoading] = createSignal(false);

  const num = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

  const applyPreset = (kind: "classic" | "fast" | "strength" | "risk") => {
    setStrategy(kind === "strength" ? "strength" : "classic");
    setStrengthFull(0.1);
    setMinWeight(0.2);
    setMaDays(30);
    setBuyRatio(kind === "fast" ? 1.03 : 1.05);
    setSellRatio(kind === "fast" ? 0.98 : 0.95);
    setBuyServiceCharge(0.0003);
    setSellServiceCharge(0.0008);
    setSlippage(0.0002);
    setCashYield(0.02);
    setDividendYield(0.02);
    setExecutionDelay(1);
    if (kind === "risk") {
      setVolTargetOn(true);
      setVolTarget(0.2);
      setVolLookback(20);
      setMaxLeverage(1.0);
      setRebalanceBand(0.05);
    } else {
      setVolTargetOn(false);
    }
  };

  const fetchSimulateResult = async (code: string) => {
    setLoading(true);
    const postData: SimulateFormState = {
      code,
      initCash: Math.max(1, num(initCash(), 100000)),
      maDays: Math.max(1, Math.round(num(maDays(), 30))),
      sellRatio: num(sellRatio(), 0.95),
      buyRatio: num(buyRatio(), 1.05),
      dateBegin: dateBegin(),
      dateEnd: dateEnd(),
      buyServiceCharge: Math.max(0, num(buyServiceCharge(), 0.0003)),
      sellServiceCharge: Math.max(0, num(sellServiceCharge(), 0.0008)),
      slippage: Math.max(0, num(slippage(), 0.0002)),
      cashYield: num(cashYield(), 0.02),
      dividendYield: num(dividendYield(), 0.02),
      executionDelay: Number(executionDelay()),
      volTarget: volTargetOn() ? Math.max(0, num(volTarget(), 0.2)) : 0,
      volLookback: Math.max(2, Math.round(num(volLookback(), 20))),
      maxLeverage: Math.max(1, num(maxLeverage(), 1.0)),
      marginRate: Math.max(0, num(marginRate(), 0.04)),
      rebalanceBand: Math.max(0, num(rebalanceBand(), 0.05)),
      strategy: strategy(),
      strengthFull: Math.max(0.01, num(strengthFull(), 0.1)),
      minWeight: Math.max(0, Math.min(1, num(minWeight(), 0.2))),
      decisionFrequency: decisionFrequency(),
    };

    return simulateApi
      .simulate(postData)
      .then((data) => {
        setSimulateResult(data);
      })
      .catch((e) => {
        alert(e.response?.data?.message ?? e.response?.data ?? e.message);
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
      <div class="form-actions">
        <button type="button" onClick={handleSubmit} disabled={loading()}>
          {loading() ? "回测中..." : "回测模拟"}
        </button>
        <button type="button" class="secondary" onClick={() => applyPreset("classic")}>
          经典参数
        </button>
        <button type="button" class="secondary" onClick={() => applyPreset("fast")}>
          快速 3%/2%
        </button>
        <button type="button" class="secondary" onClick={() => applyPreset("strength")}>
          强度仓位
        </button>
        <button type="button" class="secondary" onClick={() => applyPreset("risk")}>
          波动率目标
        </button>
      </div>

      <div class="form-section">
        <h3>策略参数</h3>
        <div class="form-grid">
          <label>
            <span>策略模式</span>
            <select
              value={strategy()}
              onChange={(e) => setStrategy(e.currentTarget.value as "classic" | "strength")}
            >
              <option value="classic">经典突破（全仓/空仓）</option>
              <option value="strength">强度仓位</option>
            </select>
            <small>强度模式：突破越强仓位越高，收盘跌破 MA 离场</small>
          </label>
          <label>
            <span>决策频率</span>
            <select
              value={decisionFrequency()}
              onChange={(e) =>
                setDecisionFrequency(e.currentTarget.value as "daily" | "weekly" | "monthly")
              }
            >
              <option value="daily">日频（研究）</option>
              <option value="weekly">周频（少操作）</option>
              <option value="monthly">月频（更少操作）</option>
            </select>
            <small>周频/月频只在周期最后一个交易日更新信号</small>
          </label>
          <label>
            <span>初始现金</span>
            <input
              type="number"
              min="1"
              step="1000"
              value={initCash()}
              onInput={(e) => setInitCash(e.currentTarget.valueAsNumber)}
            />
          </label>
          <label>
            <span>均线天数 MA</span>
            <input
              type="number"
              min="1"
              step="1"
              value={maDays()}
              onInput={(e) => setMaDays(e.currentTarget.valueAsNumber)}
            />
          </label>
          <label>
            <span>买入阈值（收盘 / MA）</span>
            <input
              type="number"
              step="0.01"
              value={buyRatio()}
              onInput={(e) => setBuyRatio(e.currentTarget.valueAsNumber)}
            />
            <small>1.05 = 收盘高于 MA 5% 时买入</small>
          </label>
          <label>
            <span>卖出阈值（收盘 / N 日最高）</span>
            <input
              type="number"
              step="0.01"
              disabled={strategy() === "strength"}
              value={sellRatio()}
              onInput={(e) => setSellRatio(e.currentTarget.valueAsNumber)}
            />
            <small>
              {strategy() === "strength"
                ? "强度模式改为收盘跌破 MA 离场，此阈值不生效"
                : "0.95 = 从 N 日高点回落 5% 时卖出"}
            </small>
          </label>
          <Show when={strategy() === "strength"}>
            <label>
              <span>满仓距离（高于 MA）</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={strengthFull()}
                onInput={(e) => setStrengthFull(e.currentTarget.valueAsNumber)}
              />
              <small>0.10 = 收盘高于 MA 10% 时满仓</small>
            </label>
            <label>
              <span>最低仓位</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={minWeight()}
                onInput={(e) => setMinWeight(e.currentTarget.valueAsNumber)}
              />
              <small>0.20 = 持仓期间至少保留 20% 仓位</small>
            </label>
          </Show>
          <label>
            <span>开始日期</span>
            <input
              type="date"
              value={dateBegin()}
              onInput={(e) => setDateBegin(e.currentTarget.value)}
            />
          </label>
          <label>
            <span>结束日期</span>
            <input
              type="date"
              value={dateEnd()}
              onInput={(e) => setDateEnd(e.currentTarget.value)}
            />
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>成本与现金收益</h3>
        <div class="form-grid">
          <label>
            <span>买入费率</span>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={buyServiceCharge()}
              onInput={(e) => setBuyServiceCharge(e.currentTarget.valueAsNumber)}
            />
            <small>0.0003 = 3bp</small>
          </label>
          <label>
            <span>卖出费率</span>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={sellServiceCharge()}
              onInput={(e) => setSellServiceCharge(e.currentTarget.valueAsNumber)}
            />
            <small>可包含印花税，如 0.0008 = 8bp</small>
          </label>
          <label>
            <span>单边滑点</span>
            <input
              type="number"
              min="0"
              step="0.0001"
              value={slippage()}
              onInput={(e) => setSlippage(e.currentTarget.valueAsNumber)}
            />
            <small>0.0002 = 2bp</small>
          </label>
          <label>
            <span>成交延迟</span>
            <select
              value={String(executionDelay())}
              onChange={(e) => setExecutionDelay(Number(e.currentTarget.value))}
            >
              <option value="0">当日收盘成交</option>
              <option value="1">T+1 收盘成交</option>
            </select>
            <small>更接近真实下单流程</small>
          </label>
          <label>
            <span>现金年化收益</span>
            <input
              type="number"
              step="0.001"
              value={cashYield()}
              onInput={(e) => setCashYield(e.currentTarget.valueAsNumber)}
            />
            <small>0.02 = 2%，空仓时计入</small>
          </label>
          <label>
            <span>股息年化（再投资）</span>
            <input
              type="number"
              step="0.001"
              value={dividendYield()}
              onInput={(e) => setDividendYield(e.currentTarget.valueAsNumber)}
            />
            <small>价格指数不含分红，0.02 近似全收益；按收盘价再投资</small>
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>风险管理</h3>
        <label class="checkbox">
          <input
            type="checkbox"
            checked={volTargetOn()}
            onChange={(e) => setVolTargetOn(e.currentTarget.checked)}
          />
          <span>启用 EWMA 波动率目标仓位</span>
        </label>
        <Show when={volTargetOn()}>
          <div class="form-grid">
            <label>
              <span>目标年化波动率</span>
              <input
                type="number"
                step="0.01"
                value={volTarget()}
                onInput={(e) => setVolTarget(e.currentTarget.valueAsNumber)}
              />
              <small>0.20 = 20%，低波动时加仓、高波动时减仓</small>
            </label>
            <label>
              <span>波动率回看天数</span>
              <input
                type="number"
                min="2"
                step="1"
                value={volLookback()}
                onInput={(e) => setVolLookback(e.currentTarget.valueAsNumber)}
              />
            </label>
            <label>
              <span>最大杠杆</span>
              <input
                type="number"
                min="1"
                step="0.05"
                value={maxLeverage()}
                onInput={(e) => setMaxLeverage(e.currentTarget.valueAsNumber)}
              />
              <small>1.0 = 不加杠杆</small>
            </label>
            <label>
              <span>融资年化成本</span>
              <input
                type="number"
                min="0"
                step="0.001"
                value={marginRate()}
                onInput={(e) => setMarginRate(e.currentTarget.valueAsNumber)}
              />
              <small>现金为负时计入</small>
            </label>
            <label>
              <span>调仓阈值</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rebalanceBand()}
                onInput={(e) => setRebalanceBand(e.currentTarget.valueAsNumber)}
              />
              <small>权重变化小于该值时不交易，降低换手</small>
            </label>
          </div>
        </Show>
      </div>

      <div class="form-actions">
        <button onClick={handleSubmit} disabled={loading()}>
          {loading() ? "回测中..." : "回测模拟"}
        </button>
      </div>
      <p class="hint">
        默认按 T+1 收盘成交、双边成本、2% 现金收益和 2% 股息估算。波动率目标使用 EWMA(RiskMetrics
        λ=0.94) 预测年化波动率。
      </p>
    </>
  );
};

export default SimulateForm;
