import IAnnualProfit from "./IAnnualProfit";
import IProfit from "./IProfit";
import ITrade from "./ITrade";

export default interface ISimulateResult {
  profitList: IProfit[];
  tradeList: ITrade[];
  annualProfitList: IAnnualProfit[];
  indexFinalProfitLossRatio: number;
  maFinalProfitLossRatio: number;
  indexApr: number;
  maApr: number;
  years: number;
}
