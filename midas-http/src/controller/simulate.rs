#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateForm {
    code: String,
    init_cash: f64,
    ma_days: usize,
    sell_rate: f64,
    buy_rate: f64,
    service_charge: f64,
    date_begin: Option<String>,
    date_end: Option<String>,
}

pub async fn simulate(
    form: axum::Json<SimulateForm>,
) -> Result<axum::Json<midas_core::model::SimulateResult>, crate::error::AppError> {
    match midas_core::index_data::list_by_code(form.code.trim()) {
        Err(e) => Err(crate::error::AppError::FailedWithMessage(e.to_string())),
        Ok(mut index_data_list) => {
            let date_begin = match &form.date_begin {
                None => "",
                Some(date_begin) => date_begin,
            };
            let date_end = match &form.date_end {
                None => "",
                Some(date_end) => date_end,
            };
            index_data_list_retain_by_date_range(&mut index_data_list, date_begin, date_end);
            let simulate_result = midas_core::simulate::simulate(
                form.init_cash,
                form.ma_days,
                form.sell_rate,
                form.buy_rate,
                form.service_charge,
                &index_data_list,
            );
            Ok(axum::Json(simulate_result))
        }
    }
}

fn index_data_list_retain_by_date_range(
    index_data_list: &mut Vec<midas_core::model::IndexData>,
    date_begin: &str,
    date_end: &str,
) {
    let date_begin = chrono::NaiveDate::parse_from_str(date_begin, "%Y-%m-%d");
    let date_end = chrono::NaiveDate::parse_from_str(date_end, "%Y-%m-%d");
    if date_begin.is_err() && date_end.is_err() {
        return;
    }

    index_data_list.retain(|item| {
        match chrono::NaiveDate::parse_from_str(&item.date, "%Y-%m-%d") {
            Err(_) => false,
            Ok(date) => {
                let begin_ok = match date_begin {
                    Err(_) => true,
                    Ok(date_begin) => date >= date_begin,
                };
                let end_ok = match date_end {
                    Err(_) => true,
                    Ok(date_end) => date <= date_end,
                };
                begin_ok && end_ok
            }
        }
    });
}
