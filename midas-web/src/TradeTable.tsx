import { For } from "solid-js"
import ITrade from "./interfaces/ITrade"

const TradeTable = (props: { tradeList: ITrade[] }) => {
  return (
    <details open>
      <summary>交易详情</summary>
      <table>
        <thead>
          <tr>
            <th>买入日期</th>
            <th>买入收盘价</th>
            <th>卖出日期</th>
            <th>卖出收盘价</th>
            <th>收益率</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.tradeList}>
            {item => (
              <tr>
                <td>{item.buyDate}</td>
                <td>{item.buyClosePoint.toFixed(2)}</td>
                <td>{item.sellDate}</td>
                <td>{item.sellClosePoint.toFixed(2)}</td>
                <td classList={{
                  green: item.profitRate >= 1,
                  red: item.profitRate < 1
                }}>
                  {(item.profitRate * 100).toFixed(2)}%
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </details>
  )
}

export default TradeTable
