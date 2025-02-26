use crate::*;

pub async fn list_by_code(code: axum::extract::Path<String>) -> impl axum::response::IntoResponse {
    match midas_core::index_data::list_by_code(code.trim()) {
        Err(e) => Err(error::AppError::FailedWithMessage(e.to_string())),
        Ok(index_data_list) => Ok(axum::Json(index_data_list)),
    }
}
