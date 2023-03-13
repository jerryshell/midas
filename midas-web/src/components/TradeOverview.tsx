import { createMemo } from "solid-js";
import ITrade from "../interfaces/ITrade";

const TradeOverview = (props: { tradeList: ITrade[] }) => {
  const profitTradeList = createMemo(() =>
    props.tradeList.filter((item) => item.profitLossRatio > 0)
  );

  const lossTradeList = createMemo(() =>
    props.tradeList.filter((item) => item.profitLossRatio < 0)
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
            <td class="profit">
              {(
                (profitTradeList()
                  .map((item) => item.profitLossRatio)
                  .reduce((a, b) => a + b, 0) /
                  profitTradeList().length) *
                100
              ).toFixed(2)}
              %
            </td>
          </tr>
          <tr>
            <td>平均亏损比率</td>
            <td class="loss">
              {(
                (lossTradeList()
                  .map((item) => item.profitLossRatio)
                  .reduce((a, b) => a + b, 0) /
                  lossTradeList().length) *
                100
              ).toFixed(2)}
              %
            </td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  );
};

export default TradeOverview;
