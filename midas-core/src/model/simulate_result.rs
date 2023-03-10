#[derive(Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateResult {
    pub profit_list: Vec<crate::model::Profit>,
    pub trade_list: Vec<crate::model::Trade>,
    pub annual_profit_list: Vec<crate::model::AnnualProfit>,
    pub index_final_profit_loss_ratio: f64,
    pub ma_final_profit_loss_ratio: f64,
    pub index_apr: f64,
    pub ma_apr: f64,
    pub years: f64,
}
