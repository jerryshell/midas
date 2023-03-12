#[derive(serde::Serialize, serde::Deserialize)]
pub struct IndexCode {
    pub code: String,
    pub name: String,
    pub secid: String,
}
