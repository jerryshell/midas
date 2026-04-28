import { createMemo } from "solid-js";
import ITrade from "../interfaces/ITrade";

const calcAverage = (list: number[]) => {
  if (list.length === 0) return 0;
  return list.reduce((a, b) => a + b, 0) / list.length;
};

const TradeOverview = (props: { tradeList: ITrade[] }) => {
  const profitTradeList = createMemo(() =>
    props.tradeList.filter((item) => item.profitLossRatio > 0),
  );

  const lossTradeList = createMemo(() =>
    props.tradeList.filter((item) => item.profitLossRatio < 0),
  );

  const avgProfitRatio = createMemo(
    () => calcAverage(profitTradeList().map((item) => item.profitLossRatio)) * 100,
  );

  const avgLossRatio = createMemo(
    () => calcAverage(lossTradeList().map((item) => item.profitLossRatio)) * 100,
  );

  return (
    <fieldset>
      <legend>交易总览</legend>
      <table>
        <tbody>
          <tr>
            <td>交易次数总计</td>
            <td>{props.tradeList.length}</td>
          </tr>
          <tr>
            <td>盈利交易次数</td>
            <td class="profit">{profitTradeList().length}</td>
          </tr>
          <tr>
            <td>亏损交易次数</td>
            <td class="loss">{lossTradeList().length}</td>
          </tr>
          <tr>
            <td>平均盈利比率</td>
            <td class="profit">{avgProfitRatio().toFixed(2)}%</td>
          </tr>
          <tr>
            <td>平均亏损比率</td>
            <td class="loss">{avgLossRatio().toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  );
};

export default TradeOverview;
