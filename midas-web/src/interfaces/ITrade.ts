export default interface ITrade {
  buyDate: string;
  sellDate: string;
  buyClosePoint: number;
  sellClosePoint: number;
  buyWeight: number;
  profitLossRatio: number;
  netProfitLossRatio: number;
}
