use crate::*;
use chrono::{Datelike, Duration, Local, NaiveDate, NaiveTime, Weekday};
use midas_core::simulate::{
    DecisionFrequency, SimulateOptions, StrategyMode, get_ma, get_max, simulate_with_options,
};

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignalForm {
    code: String,
    init_cash: Option<f64>,
    ma_days: Option<usize>,
    buy_ratio: Option<f64>,
    sell_ratio: Option<f64>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SignalResponse {
    code: String,
    name: String,
    date: String,
    close_point: f64,
    ma: Option<f64>,
    max_point: Option<f64>,
    holding: bool,
    position: f64,
    current_value: f64,
    action: String,
    action_text: String,
    action_date: Option<String>,
    action_is_past: bool,
    next_check_date: String,
    is_check_day: bool,
    buy_condition: bool,
    sell_condition: bool,
    reason: String,
    last_trade_date: Option<String>,
    last_trade_type: Option<String>,
    last_trade_price: Option<f64>,
    recent_trades: Vec<midas_core::model::Trade>,
    suggested_amount: f64,
}

pub async fn signal(form: axum::Json<SignalForm>) -> impl axum::response::IntoResponse {
    let init_cash = form.init_cash.unwrap_or(100_000.0);
    if !init_cash.is_finite() || init_cash <= 0.0 {
        return Err(error::AppError::FailedWithMessage(
            "初始现金必须大于 0".to_owned(),
        ));
    }
    let code = form.code.trim();
    if code.is_empty() {
        return Err(error::AppError::FailedWithMessage("请选择指数".to_owned()));
    }

    let index_data_list = match midas_core::index_data::list_by_code(code) {
        Ok(list) => list,
        Err(e) => {
            return Err(error::AppError::FailedWithMessage(e.to_string()));
        }
    };
    if index_data_list.is_empty() {
        return Err(error::AppError::FailedWithMessage(
            "指数数据为空".to_owned(),
        ));
    }

    let ma_days = form.ma_days.unwrap_or(30).clamp(1, 1000);
    let buy_ratio = form.buy_ratio.unwrap_or(1.05);
    let sell_ratio = form.sell_ratio.unwrap_or(0.95);
    let options = SimulateOptions {
        buy_service_charge: 0.0002,
        sell_service_charge: 0.0002,
        slippage: 0.0002,
        cash_yield: 0.02,
        dividend_yield: 0.02,
        execution_delay: 1,
        strategy: StrategyMode::Classic,
        decision_frequency: DecisionFrequency::Weekly,
        ..SimulateOptions::legacy(init_cash, ma_days, sell_ratio, buy_ratio, 0.0)
    };
    let result = simulate_with_options(&options, &index_data_list);
    let Some(last) = result.profit_list.last() else {
        return Err(error::AppError::FailedWithMessage(
            "没有可用的回测结果".to_owned(),
        ));
    };

    let last_index = index_data_list.len() - 1;
    let last_data = &index_data_list[last_index];
    let close = last_data.close_point;
    let ma = get_ma(last_index, ma_days, &index_data_list);
    let max_point = get_max(last_index, ma_days, &index_data_list);
    let holding = last.position > 0.5;
    let buy_condition = ma.map(|m| close / m >= buy_ratio).unwrap_or(false);
    let sell_condition = max_point.map(|m| close / m <= sell_ratio).unwrap_or(false);

    let last_date = chrono::NaiveDate::parse_from_str(&last_data.date, "%Y-%m-%d").ok();
    let is_check_day = last_date
        .map(|d| d.weekday() == Weekday::Fri)
        .unwrap_or(false);
    let action = if is_check_day {
        if buy_condition {
            if holding { "hold" } else { "buy" }
        } else if holding && sell_condition {
            "sell"
        } else if holding {
            "hold"
        } else {
            "cash"
        }
    } else if holding {
        "hold"
    } else {
        "cash"
    };

    let action_date = if is_check_day {
        last_date.map(next_weekday)
    } else {
        None
    };
    let today = Local::now().date_naive();
    let action_is_past = action_date.map(|d| today > d).unwrap_or(false);
    let action_text = action_text(action, action_date, action_is_past, today);
    let next_check_date = next_friday(today);
    let (last_trade_date, last_trade_type, last_trade_price) = result
        .trade_list
        .last()
        .map(|trade| {
            if trade.sell_date == "N/A" {
                (
                    Some(trade.buy_date.clone()),
                    Some("buy".to_owned()),
                    Some(trade.buy_close_point),
                )
            } else {
                (
                    Some(trade.sell_date.clone()),
                    Some("sell".to_owned()),
                    Some(trade.sell_close_point),
                )
            }
        })
        .unwrap_or((None, None, None));

    let name = midas_core::index_code::list()
        .ok()
        .and_then(|list| list.into_iter().find(|x| x.code == code))
        .map(|x| x.name)
        .unwrap_or_else(|| code.to_owned());

    let reason = if action == "buy" {
        format!(
            "收盘价高于 MA{ma_days} {:.1}%，触发买入",
            (buy_ratio - 1.0) * 100.0
        )
    } else if action == "sell" {
        format!(
            "收盘价从 {ma_days} 日最高回落超过 {:.1}%，触发卖出",
            (1.0 - sell_ratio) * 100.0
        )
    } else if holding {
        "未触发卖出，继续持有".to_owned()
    } else {
        "未触发买入，继续空仓".to_owned()
    };

    let recent_trades = result
        .trade_list
        .iter()
        .rev()
        .take(5)
        .cloned()
        .collect::<Vec<_>>();

    Ok(axum::Json(SignalResponse {
        code: code.to_owned(),
        name,
        date: last_data.date.clone(),
        close_point: close,
        ma,
        max_point,
        holding,
        position: last.position,
        current_value: last.value,
        action: action.to_owned(),
        action_text,
        action_date: action_date.map(|d| d.format("%Y-%m-%d").to_string()),
        action_is_past,
        next_check_date: next_check_date.format("%Y-%m-%d").to_string(),
        is_check_day,
        buy_condition,
        sell_condition,
        reason,
        last_trade_date,
        last_trade_type,
        last_trade_price,
        recent_trades,
        suggested_amount: if action == "buy" { init_cash } else { 0.0 },
    }))
}

fn action_text(
    action: &str,
    _action_date: Option<NaiveDate>,
    is_past: bool,
    _today: NaiveDate,
) -> String {
    match action {
        "hold" => "持有",
        "cash" => "空仓",
        "buy" if is_past => "买入信号（已过执行日）",
        "sell" if is_past => "卖出信号（已过执行日）",
        "buy" => "买入信号",
        "sell" => "卖出信号",
        _ => "无信号",
    }
    .to_owned()
}

fn next_weekday(mut date: NaiveDate) -> NaiveDate {
    date += Duration::days(1);
    while matches!(date.weekday(), Weekday::Sat | Weekday::Sun) {
        date += Duration::days(1);
    }
    date
}

fn next_friday(today: NaiveDate) -> NaiveDate {
    let days = (Weekday::Fri.num_days_from_monday() as i64
        - today.weekday().num_days_from_monday() as i64)
        .rem_euclid(7);
    let friday = today + Duration::days(days);
    let now = Local::now();
    let before_close = now.time() < NaiveTime::from_hms_opt(15, 0, 0).unwrap_or_default();
    if friday < today || (friday == today && !before_close) {
        friday + Duration::days(7)
    } else {
        friday
    }
}
