#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateForm {
    code: String,
    date_begin: Option<String>,
    date_end: Option<String>,
}

pub async fn simulate(
    form: axum::Json<SimulateForm>,
) -> Result<axum::Json<Vec<midas_core::model::Profit>>, crate::error::AppError> {
    match midas_core::index_data::list_by_code(form.code.trim()) {
        Err(e) => Err(crate::error::AppError::FailedWithMessage(e.to_string())),
        Ok(index_data_list) => {
            let filter_result = match &form.date_begin {
                None => Ok(index_data_list),
                Some(date_begin) => match &form.date_end {
                    None => Ok(index_data_list),
                    Some(date_end) => index_data_list_filter(index_data_list, date_begin, date_end),
                },
            };
            match filter_result {
                Err(e) => Err(crate::error::AppError::FailedWithMessage(e.to_string())),
                Ok(index_data_list) => {
                    let profit_list =
                        midas_core::simulate::simulate(30, 0.95, 1.05, 0.0, &index_data_list);
                    Ok(axum::Json(profit_list))
                }
            }
        }
    }
}

fn index_data_list_filter(
    mut index_data_list: Vec<midas_core::model::IndexData>,
    date_begin: &str,
    date_end: &str,
) -> Result<Vec<midas_core::model::IndexData>, Box<dyn std::error::Error>> {
    let date_begin = chrono::NaiveDate::parse_from_str(date_begin, "%Y-%m-%d")?;
    let date_end = chrono::NaiveDate::parse_from_str(date_end, "%Y-%m-%d")?;
    index_data_list.retain(|item| {
        let date = chrono::NaiveDate::parse_from_str(&item.date, "%Y-%m-%d").unwrap();
        date >= date_begin && date <= date_end
    });
    Ok(index_data_list)
}
