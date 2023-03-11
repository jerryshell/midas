#[derive(serde::Deserialize)]
pub struct SimulateForm {
    code: String,
}

pub async fn simulate(
    form: axum::Json<SimulateForm>,
) -> Result<axum::Json<Vec<midas_core::model::Profit>>, crate::error::AppError> {
    match midas_core::index_data::list_by_code(form.code.trim()) {
        Err(e) => Err(crate::error::AppError::FailedWithMessage(e.to_string())),
        Ok(index_data_list) => {
            let profit_list = midas_core::simulate::simulate(30, 0.95, 1.05, 0.0, &index_data_list);
            Ok(axum::Json(profit_list))
        }
    }
}