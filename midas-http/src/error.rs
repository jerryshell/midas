#[derive(Debug)]
pub enum AppError {
    Failed(),
    FailedWithMessage(String),
    FailedWithCodeAndMessage(String, String),
}

impl axum::response::IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, code, message) = match self {
            AppError::Failed() => (
                axum::http::StatusCode::BAD_REQUEST,
                "failed".to_owned(),
                "failed".to_owned(),
            ),
            AppError::FailedWithMessage(message) => (
                axum::http::StatusCode::BAD_REQUEST,
                "failed".to_owned(),
                message,
            ),
            AppError::FailedWithCodeAndMessage(code, message) => {
                (axum::http::StatusCode::BAD_REQUEST, code, message)
            }
        };
        let response_map = std::collections::HashMap::from([("code", code), ("message", message)]);
        (status, axum::Json(response_map)).into_response()
    }
}
