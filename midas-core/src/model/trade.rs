#[derive(Default, Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trade {
    pub buy_date: String,
    pub sell_date: String,
    pub buy_close_point: f64,
    pub sell_close_point: f64,
    pub profit_rate: f64,
}
