#[derive(Default, Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateResult {
    pub profit_list: Vec<crate::model::Profit>,
    pub trade_list: Vec<crate::model::Trade>,
    pub index_final_profit_loss_ratio: f64,
    pub ma_final_profit_loss_ratio: f64,
    pub index_apr: f64,
    pub ma_apr: f64,
    pub years: f64,
}
