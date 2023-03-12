#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexData {
    pub date: String,
    pub close_point: f64,
}
