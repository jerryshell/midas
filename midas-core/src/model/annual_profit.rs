#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnnualProfit {
    pub year: String,
    pub index_profit: f64,
    pub ma_profit: f64,
}
