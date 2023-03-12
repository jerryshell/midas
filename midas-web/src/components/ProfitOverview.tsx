import ISimulateResult from "../interfaces/ISimulateResult";

const ProfitOverview = (props: { simulateResult: ISimulateResult }) => {
  return (
    <fieldset>
      <legend>交易总览</legend>
      <table>
        <thead>
          <tr>
            <th>投资类型</th>
            <th>投资时长（年）</th>
            <th>最终收益率</th>
            <th>平均年化率</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>指数投资</td>
            <td>{props.simulateResult.years.toFixed(2)}</td>
            <td>
              {(props.simulateResult.indexFinalProfitLossRatio * 100).toFixed(
                2
              )}
              %
            </td>
            <td>{(props.simulateResult.indexApr * 100).toFixed(2)}%</td>
          </tr>
          <tr>
            <td>均线投资</td>
            <td>{props.simulateResult.years.toFixed(2)}</td>
            <td>
              {(props.simulateResult.maFinalProfitLossRatio * 100).toFixed(2)}%
            </td>
            <td>{(props.simulateResult.maApr * 100).toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
    </fieldset>
  );
};

export default ProfitOverview;
