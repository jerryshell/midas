import IProfit from "./IProfit";
import ITrade from "./ITrade";

export default interface ISimulateResult {
  profitList: IProfit[],
  tradeList: ITrade[],
}
