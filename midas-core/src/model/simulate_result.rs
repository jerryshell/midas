use crate::*;

#[derive(Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateResult {
    pub profit_list: Vec<model::Profit>,
    pub trade_list: Vec<model::Trade>,
    pub annual_profit_list: Vec<model::AnnualProfit>,
    pub index_final_profit_loss_ratio: f64,
    pub ma_final_profit_loss_ratio: f64,
    pub index_apr: f64,
    pub ma_apr: f64,
    pub years: f64,
    /// 策略日收益的年化波动率。
    pub ma_volatility: f64,
    /// 策略日收益的年化 Sharpe（无风险利率按 0，现金收益已计入净值）。
    pub ma_sharpe: f64,
    /// 策略最大回撤（负数）。
    pub ma_max_drawdown: f64,
    /// 年化收益 / |最大回撤|。
    pub ma_calmar: f64,
    /// 平均持仓权重，衡量资金利用率。
    pub ma_exposure: f64,
    /// 指数买入持有的年化 Sharpe。
    pub index_sharpe: f64,
    /// 指数买入持有的最大回撤（负数）。
    pub index_max_drawdown: f64,
    pub trade_count: usize,
    /// 已平仓交易的胜率。
    pub win_rate: f64,
    /// 已平仓交易的净盈亏比（总盈利 / 总亏损）。
    pub profit_factor: f64,
    pub total_fees: f64,
    pub total_dividends: f64,
    pub total_interest: f64,
}
