#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Profit {
    pub date: String,
    pub close_point: f64,
    pub value: f64,
}
