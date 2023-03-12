#[derive(Default, Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateResult {
    pub profit_list: Vec<crate::model::Profit>,
    pub trade_list: Vec<crate::model::Trade>,
}
