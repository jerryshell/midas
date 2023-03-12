#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Trade {
    pub buy_date: String,
    pub sell_date: String,
    pub buy_close_point: f64,
    pub sell_close_point: f64,
    pub profit_loss_ratio: f64,
}
