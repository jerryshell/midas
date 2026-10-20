import { For } from "solid-js";
import ITrade from "../interfaces/ITrade";

const TradeDetailTable = (props: { tradeList: ITrade[] }) => {
  return (
    <details>
      <summary>交易明细（{props.tradeList.length} 笔）</summary>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>买入日期</th>
              <th>买入价</th>
              <th>卖出日期</th>
              <th>卖出价</th>
              <th>仓位</th>
              <th>毛收益</th>
              <th>净收益</th>
            </tr>
          </thead>
          <tbody>
            <For each={props.tradeList}>
              {(item) => (
                <tr>
                  <td>{item.buyDate}</td>
                  <td>{item.buyClosePoint.toFixed(2)}</td>
                  <td>{item.sellDate}</td>
                  <td>{item.sellClosePoint.toFixed(2)}</td>
                  <td>{(item.buyWeight * 100).toFixed(0)}%</td>
                  <td
                    classList={{
                      profit: item.profitLossRatio >= 0,
                      loss: item.profitLossRatio < 0,
                    }}
                  >
                    {(item.profitLossRatio * 100).toFixed(2)}%
                  </td>
                  <td
                    classList={{
                      profit: item.netProfitLossRatio >= 0,
                      loss: item.netProfitLossRatio < 0,
                    }}
                  >
                    {(item.netProfitLossRatio * 100).toFixed(2)}%
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </details>
  );
};

export default TradeDetailTable;
