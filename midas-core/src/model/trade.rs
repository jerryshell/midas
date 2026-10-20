#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Trade {
    pub buy_date: String,
    pub sell_date: String,
    pub buy_close_point: f64,
    pub sell_close_point: f64,
    /// 开仓时的目标权重（波动率目标下可能小于 1）。
    pub buy_weight: f64,
    /// 价格口径的毛收益，不含费用/股息。
    pub profit_loss_ratio: f64,
    /// 价格口径、扣除双边费用后的净收益。
    pub net_profit_loss_ratio: f64,
}
