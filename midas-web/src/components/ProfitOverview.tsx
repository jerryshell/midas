import ISimulateResult from "../interfaces/ISimulateResult";

const pct = (value: number, digits = 2) =>
  Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : "-";

const num = (value: number, digits = 2) => (Number.isFinite(value) ? value.toFixed(digits) : "-");

const money = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString("zh-CN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "-";

const signClass = (value: number) => (value > 0 ? "profit" : value < 0 ? "loss" : "");

const ProfitOverview = (props: { simulateResult: ISimulateResult }) => {
  return (
    <>
      <div class="metric-grid">
        <div class="metric">
          <span class="metric-label">策略年化</span>
          <strong class={signClass(props.simulateResult.maApr)}>
            {pct(props.simulateResult.maApr)}
          </strong>
          <small>指数 {pct(props.simulateResult.indexApr)}</small>
        </div>
        <div class="metric">
          <span class="metric-label">Sharpe</span>
          <strong>{num(props.simulateResult.maSharpe)}</strong>
          <small>指数 {num(props.simulateResult.indexSharpe)}</small>
        </div>
        <div class="metric">
          <span class="metric-label">最大回撤</span>
          <strong class="loss">{pct(props.simulateResult.maMaxDrawdown)}</strong>
          <small>指数 {pct(props.simulateResult.indexMaxDrawdown)}</small>
        </div>
        <div class="metric">
          <span class="metric-label">Calmar</span>
          <strong>{num(props.simulateResult.maCalmar)}</strong>
          <small>年化 / |最大回撤|</small>
        </div>
        <div class="metric">
          <span class="metric-label">平均仓位</span>
          <strong>{pct(props.simulateResult.maExposure, 0)}</strong>
          <small>资金利用率</small>
        </div>
        <div class="metric">
          <span class="metric-label">交易次数</span>
          <strong>{props.simulateResult.tradeCount}</strong>
          <small>胜率 {pct(props.simulateResult.winRate, 0)}</small>
        </div>
      </div>

      <fieldset>
        <legend>收益与风险对比</legend>
        <div class="table-scroll">
          <table class="compare-table">
            <thead>
              <tr>
                <th>投资类型</th>
                <th>最终收益率</th>
                <th>年化</th>
                <th>Sharpe</th>
                <th>最大回撤</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>指数买入持有</td>
                <td class={signClass(props.simulateResult.indexFinalProfitLossRatio)}>
                  {pct(props.simulateResult.indexFinalProfitLossRatio)}
                </td>
                <td class={signClass(props.simulateResult.indexApr)}>
                  {pct(props.simulateResult.indexApr)}
                </td>
                <td>{num(props.simulateResult.indexSharpe)}</td>
                <td class="loss">{pct(props.simulateResult.indexMaxDrawdown)}</td>
              </tr>
              <tr>
                <td>均线策略</td>
                <td class={signClass(props.simulateResult.maFinalProfitLossRatio)}>
                  {pct(props.simulateResult.maFinalProfitLossRatio)}
                </td>
                <td class={signClass(props.simulateResult.maApr)}>
                  {pct(props.simulateResult.maApr)}
                </td>
                <td>{num(props.simulateResult.maSharpe)}</td>
                <td class="loss">{pct(props.simulateResult.maMaxDrawdown)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="hint">
          回测 {num(props.simulateResult.years)}{" "}
          年；指数基准为价格指数，策略净值包含现金收益和股息估算。
        </p>
      </fieldset>

      <fieldset>
        <legend>成本与收益拆解</legend>
        <div class="metric-grid compact">
          <div class="metric">
            <span class="metric-label">手续费 + 滑点</span>
            <strong class="loss">{money(props.simulateResult.totalFees)}</strong>
          </div>
          <div class="metric">
            <span class="metric-label">股息再投资</span>
            <strong class="profit">{money(props.simulateResult.totalDividends)}</strong>
          </div>
          <div class="metric">
            <span class="metric-label">现金利息</span>
            <strong class="profit">{money(props.simulateResult.totalInterest)}</strong>
          </div>
          <div class="metric">
            <span class="metric-label">盈亏比</span>
            <strong>{num(props.simulateResult.profitFactor)}</strong>
            <small>已平仓交易，净收益口径</small>
          </div>
        </div>
      </fieldset>
    </>
  );
};

export default ProfitOverview;
