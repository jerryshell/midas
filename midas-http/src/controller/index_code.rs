pub async fn list() -> Result<axum::Json<Vec<midas_core::model::IndexCode>>, crate::error::AppError>
{
    match midas_core::index_code::list() {
        Err(e) => Err(crate::error::AppError::FailedWithMessage(e.to_string())),
        Ok(index_code_list) => Ok(axum::Json(index_code_list)),
    }
}
