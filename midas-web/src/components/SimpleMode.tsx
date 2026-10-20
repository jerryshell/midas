import { createEffect, createSignal, Show, untrack } from "solid-js";
import signalApi from "../api/signalApi";
import { currentIndexCode, setAppMode } from "../GlobalSignal";
import ISignal from "../interfaces/ISignal";

const formatMoney = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString("zh-CN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : "-";

const formatPrice = (value: number | null) =>
  value === null || !Number.isFinite(value) ? "-" : value.toFixed(2);

const actionLabel = (action: ISignal["action"]) => {
  switch (action) {
    case "buy":
      return "买入信号";
    case "sell":
      return "卖出信号";
    default:
      return "无操作";
  }
};

const SimpleMode = () => {
  const [capital, setCapital] = createSignal(100000);
  const [signal, setSignal] = createSignal<ISignal | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const loadSignal = async () => {
    const code = currentIndexCode()?.code;
    if (!code) return;
    setLoading(true);
    setError("");
    return signalApi
      .signal({ code, initCash: Math.max(1, capital()) })
      .then((data: ISignal) => setSignal(data))
      .catch((e) => {
        setSignal(null);
        setError(e.response?.data?.message ?? e.response?.data ?? e.message);
      })
      .finally(() => setLoading(false));
  };

  createEffect(() => {
    const code = currentIndexCode()?.code;
    if (code) {
      untrack(() => {
        void loadSignal();
      });
    }
  });

  const notice = () => {
    const data = signal();
    if (!data) return "";
    if (data.actionIsPast) {
      return "该信号已过执行日，仅作记录；请以下次检查日的信号为准。";
    }
    if (!data.isCheckDay && !data.holding && data.buyCondition) {
      return "已满足买入条件，但周频规则要等到本周五收盘确认。";
    }
    if (!data.isCheckDay && data.holding && data.sellCondition) {
      return "已满足卖出条件，但周频规则要等到本周五收盘确认。";
    }
    if (data.isCheckDay && (data.action === "buy" || data.action === "sell")) {
      return "今日为检查日，信号在收盘后确认，执行日为下一个交易日。";
    }
    return "";
  };

  const lastTradeText = () => {
    const data = signal();
    if (!data?.lastTradeDate) return "暂无";
    const type = data.lastTradeType === "buy" ? "买入" : "卖出";
    return `${data.lastTradeDate} ${type} @ ${formatPrice(data.lastTradePrice)}`;
  };

  return (
    <>
      <div class="simple-toolbar">
        <label>
          <span>计划资金</span>
          <input
            type="number"
            min="1"
            step="1000"
            value={capital()}
            onChange={(e) => setCapital(Math.max(1, e.currentTarget.valueAsNumber || 100000))}
          />
        </label>
      </div>

      <p class="hint">
        周频规则：每周五收盘后检查。收盘高于 30 日均线 5% 时买入；从 30 日最高回落 5%
        时卖出；信号变化后下一个交易日执行。
      </p>

      <Show when={error()}>
        <div class="notice error" role="alert">
          <span>{error()}</span>
          <button type="button" class="link-button" onClick={() => void loadSignal()}>
            重试
          </button>
        </div>
      </Show>

      <Show
        when={!loading()}
        fallback={
          <div class="simple-card loading" aria-live="polite">
            正在读取本周信号…
          </div>
        }
      >
        <Show
          when={signal()}
          fallback={
            <Show when={!error()}>
              <p class="hint">
                暂无信号数据。
                <button type="button" class="link-button" onClick={() => void loadSignal()}>
                  重新读取
                </button>
              </p>
            </Show>
          }
        >
          {(data) => (
            <div class="simple-card" aria-live="polite">
              <div class="simple-head">
                <div>
                  <strong class="simple-title">
                    {data().code} {data().name}
                  </strong>
                  <span class="hint">数据日期 {data().date}</span>
                </div>
                <span
                  classList={{
                    "status-badge": true,
                    holding: data().holding,
                    cash: !data().holding,
                  }}
                >
                  {data().holding ? "持有" : "空仓"}
                </span>
              </div>

              <div class="simple-action">
                <span class="simple-label">策略信号</span>
                <strong>{actionLabel(data().action)}</strong>
                <Show when={data().actionDate}>
                  <span class="hint">执行日 {data().actionDate}</span>
                </Show>
              </div>

              <div class="simple-grid">
                <div>
                  <span class="simple-label">示例 ETF</span>
                  <strong>
                    {data().fundCode ? `${data().fundCode} ${data().fundName}` : "暂无示例 ETF"}
                  </strong>
                  <small>{data().exchange || "可在研究模式查看其他指数"}</small>
                </div>
                <Show when={data().action === "buy"}>
                  <div>
                    <span class="simple-label">金额</span>
                    <strong>¥{formatMoney(capital())}</strong>
                    <small>按计划资金估算</small>
                  </div>
                </Show>
                <Show when={data().action === "sell"}>
                  <div>
                    <span class="simple-label">金额</span>
                    <strong>卖出全部持仓</strong>
                    <small>以实际持仓为准</small>
                  </div>
                </Show>
                <div>
                  <span class="simple-label">下次检查</span>
                  <strong>{data().nextCheckDate}</strong>
                  <small>周五收盘后</small>
                </div>
              </div>

              <Show when={notice()}>
                <p class="notice">{notice()}</p>
              </Show>

              <p class="simple-footnote">最近交易：{lastTradeText()}</p>

              <div class="simple-actions">
                <button type="button" class="link-button" onClick={() => setAppMode("research")}>
                  查看回测
                </button>
              </div>

              <p class="disclaimer">
                示例 ETF 请自行核对代码、规模和费率；本页仅为机械规则回测结果。
              </p>
            </div>
          )}
        </Show>
      </Show>
    </>
  );
};

export default SimpleMode;
