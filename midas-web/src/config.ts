export const SIMPLE_INDEX_CODES = ["000300", "000016", "399006", "000688"] as const;

export const SIMPLE_FUNDS: Record<string, { code: string; name: string; exchange: string }> = {
  "000300": { code: "510300", name: "沪深300ETF", exchange: "上交所" },
  "000016": { code: "510050", name: "上证50ETF", exchange: "上交所" },
  "399006": { code: "159915", name: "创业板ETF", exchange: "深交所" },
  "000688": { code: "588000", name: "科创50ETF", exchange: "上交所" },
};
