pub async fn list_by_code(
    code: axum::extract::Path<String>,
) -> Result<axum::Json<Vec<midas_core::model::IndexData>>, crate::error::AppError> {
    match midas_core::get_index_data_list_by_code(code.trim()) {
        Err(e) => Err(crate::error::AppError::FailedWithMessage(e.to_string())),
        Ok(index_data_list) => Ok(axum::Json(index_data_list)),
    }
}
