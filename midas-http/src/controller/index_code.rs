pub async fn list() -> impl axum::response::IntoResponse {
    match midas_core::index_code::list() {
        Err(e) => Err(crate::error::AppError::FailedWithMessage(e.to_string())),
        Ok(index_code_list) => Ok(axum::Json(index_code_list)),
    }
}
