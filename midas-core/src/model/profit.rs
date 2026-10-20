#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Profit {
    pub date: String,
    pub close_point: f64,
    pub value: f64,
    /// 当日收盘后的持仓权重（0~max_leverage）。
    pub position: f64,
}
