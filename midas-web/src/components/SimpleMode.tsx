import { createEffect, createSignal, For, Show, untrack } from "solid-js";
import signalApi from "../api/signalApi";
import { currentIndexCode, setAppMode } from "../GlobalSignal";
import ISignal from "../interfaces/ISignal";

const formatMoney = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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
    case "hold":
      return "无操作（持有）";
    default:
      return "无操作（空仓）";
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
    // 只在指数变化时自动刷新；资金修改后由“刷新信号”触发。
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
      return "当前已满足买入条件，但周频策略需等到本周五收盘确认。";
    }
    if (!data.isCheckDay && data.holding && data.sellCondition) {
      return "当前已满足卖出条件，但周频策略需等到本周五收盘确认。";
    }
    if (data.isCheckDay && (data.action === "buy" || data.action === "sell")) {
      return "今日为检查日，信号在收盘后确认，执行日为下一个交易日。";
    }
    return "";
  };

  const amountText = () => {
    const data = signal();
    if (!data) return "-";
    if (data.action === "buy") return `¥${formatMoney(data.suggestedAmount)}`;
    if (data.action === "sell") return "卖出全部持仓";
    if (data.action === "hold") return "保持当前持仓";
    return "—";
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
        <button type="button" onClick={() => void loadSignal()} disabled={loading()}>
          {loading() ? "读取中..." : "刷新信号"}
        </button>
      </div>

      <p class="hint">
        周频规则：每周五收盘后检查，信号变化时在下一个交易日执行。默认按经典 MA30、买入阈值
        1.05、卖出阈值 0.95、ETF 双边成本估算。
      </p>

      <Show when={error()}>
        <p class="notice error">{error()}</p>
      </Show>

      <Show when={signal()} fallback={<p class="hint">选择指数后读取信号。</p>}>
        {(data) => (
          <div class="simple-card">
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
                <span class="simple-label">基金</span>
                <strong>
                  {data().fundCode ? `${data().fundCode} ${data().fundName}` : "暂无示例 ETF"}
                </strong>
                <small>{data().exchange || "请在研究模式查看其他指数"}</small>
              </div>
              <div>
                <span class="simple-label">金额</span>
                <strong>{amountText()}</strong>
                <small>
                  {data().action === "buy"
                    ? "按计划资金估算"
                    : data().action === "sell"
                      ? "以实际持仓为准"
                      : "无交易"}
                </small>
              </div>
              <div>
                <span class="simple-label">下次检查</span>
                <strong>{data().nextCheckDate}</strong>
                <small>周五收盘后</small>
              </div>
              <div>
                <span class="simple-label">最近交易</span>
                <strong>{lastTradeText()}</strong>
                <small>以策略回测记录为准</small>
              </div>
            </div>

            <Show when={notice()}>
              <p class="notice">{notice()}</p>
            </Show>

            <details class="simple-rules">
              <summary>查看规则与数据</summary>
              <div class="simple-conditions">
                <span>收盘 {formatPrice(data().closePoint)}</span>
                <span>MA30 {formatPrice(data().ma)}</span>
                <span>30 日最高 {formatPrice(data().maxPoint)}</span>
                <span class={data().buyCondition ? "profit" : "muted"}>
                  买入条件 {data().buyCondition ? "满足" : "未满足"}
                </span>
                <span class={data().holding && data().sellCondition ? "loss" : "muted"}>
                  卖出条件{" "}
                  {data().holding ? (data().sellCondition ? "满足" : "未满足") : "持仓时生效"}
                </span>
              </div>
              <p class="hint">{data().reason}</p>
            </details>

            <div class="simple-actions">
              <button type="button" class="secondary" onClick={() => setAppMode("research")}>
                查看回测
              </button>
            </div>

            <Show when={data().recentTrades.length > 0}>
              <details>
                <summary>最近 {data().recentTrades.length} 笔交易</summary>
                <div class="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>买入</th>
                        <th>买入价</th>
                        <th>卖出</th>
                        <th>卖出价</th>
                        <th>净收益</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={data().recentTrades}>
                        {(trade) => (
                          <tr>
                            <td>{trade.buyDate}</td>
                            <td>{formatPrice(trade.buyClosePoint)}</td>
                            <td>{trade.sellDate}</td>
                            <td>{formatPrice(trade.sellClosePoint)}</td>
                            <td
                              classList={{
                                profit: trade.netProfitLossRatio >= 0,
                                loss: trade.netProfitLossRatio < 0,
                              }}
                            >
                              {(trade.netProfitLossRatio * 100).toFixed(2)}%
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </details>
            </Show>

            <p class="disclaimer">
              仅为机械规则回测结果，不构成投资建议。ETF
              代码为示例，请自行核对基金代码、规模、费率与跟踪误差。
            </p>
          </div>
        )}
      </Show>
    </>
  );
};

export default SimpleMode;
