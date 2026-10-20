import ITrade from "./ITrade";

export default interface ISignal {
  code: string;
  name: string;
  date: string;
  closePoint: number;
  ma: number | null;
  maxPoint: number | null;
  holding: boolean;
  position: number;
  currentValue: number;
  action: "buy" | "sell" | "hold" | "cash";
  actionText: string;
  actionDate: string | null;
  actionIsPast: boolean;
  nextCheckDate: string;
  isCheckDay: boolean;
  buyCondition: boolean;
  sellCondition: boolean;
  reason: string;
  lastTradeDate: string | null;
  lastTradeType: "buy" | "sell" | null;
  lastTradePrice: number | null;
  recentTrades: ITrade[];
  suggestedAmount: number;
}
