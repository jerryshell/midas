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
  maVolatility: number;
  maSharpe: number;
  maMaxDrawdown: number;
  maCalmar: number;
  maExposure: number;
  indexSharpe: number;
  indexMaxDrawdown: number;
  tradeCount: number;
  winRate: number;
  profitFactor: number;
  totalFees: number;
  totalDividends: number;
  totalInterest: number;
}
