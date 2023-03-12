#[derive(Default, Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexCode {
    pub code: String,
    pub name: String,
    pub secid: String,
}
