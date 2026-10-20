use crate::*;
use midas_core::simulate::{SimulateOptions, StrategyMode, simulate_with_options};

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateForm {
    code: String,
    init_cash: f64,
    ma_days: usize,
    sell_ratio: f64,
    buy_ratio: f64,
    /// 旧字段：只在卖出时收取。保留以兼容旧前端。
    #[serde(default)]
    service_charge: Option<f64>,
    date_begin: Option<String>,
    date_end: Option<String>,
    #[serde(default)]
    buy_service_charge: Option<f64>,
    #[serde(default)]
    sell_service_charge: Option<f64>,
    #[serde(default)]
    slippage: Option<f64>,
    #[serde(default)]
    cash_yield: Option<f64>,
    #[serde(default)]
    dividend_yield: Option<f64>,
    #[serde(default)]
    execution_delay: Option<usize>,
    #[serde(default)]
    vol_target: Option<f64>,
    #[serde(default)]
    vol_lookback: Option<usize>,
    #[serde(default)]
    max_leverage: Option<f64>,
    #[serde(default)]
    margin_rate: Option<f64>,
    #[serde(default)]
    rebalance_band: Option<f64>,
    #[serde(default)]
    strategy: Option<String>,
    #[serde(default)]
    strength_full: Option<f64>,
    #[serde(default)]
    min_weight: Option<f64>,
}

pub async fn simulate(form: axum::Json<SimulateForm>) -> impl axum::response::IntoResponse {
    if !form.init_cash.is_finite() || form.init_cash <= 0.0 {
        return Err(error::AppError::FailedWithMessage(
            "初始现金必须大于 0".to_owned(),
        ));
    }

    let code = form.code.trim();
    if code.is_empty() {
        return Err(error::AppError::FailedWithMessage("请选择指数".to_owned()));
    }

    match midas_core::index_data::list_by_code(code) {
        Err(e) => Err(error::AppError::FailedWithMessage(e.to_string())),
        Ok(index_data_list) => {
            let date_begin = non_empty(form.date_begin.clone());
            let date_end = non_empty(form.date_end.clone());
            if matches!((&date_begin, &date_end), (Some(begin), Some(end)) if begin > end) {
                return Err(error::AppError::FailedWithMessage(
                    "开始日期不能晚于结束日期".to_owned(),
                ));
            }

            let legacy_sell = form.service_charge.unwrap_or(0.0);
            let options = SimulateOptions {
                init_cash: form.init_cash,
                ma_days: form.ma_days,
                sell_ratio: form.sell_ratio,
                buy_ratio: form.buy_ratio,
                buy_service_charge: form.buy_service_charge.unwrap_or(0.0),
                sell_service_charge: form.sell_service_charge.unwrap_or(legacy_sell),
                slippage: form.slippage.unwrap_or(0.0),
                cash_yield: form.cash_yield.unwrap_or(0.0),
                dividend_yield: form.dividend_yield.unwrap_or(0.0),
                execution_delay: form.execution_delay.unwrap_or(0),
                vol_target: form.vol_target.unwrap_or(0.0),
                vol_lookback: form.vol_lookback.unwrap_or(20),
                max_leverage: form.max_leverage.unwrap_or(1.0),
                margin_rate: form.margin_rate.unwrap_or(0.04),
                rebalance_band: form.rebalance_band.unwrap_or(0.05),
                strategy: StrategyMode::parse(form.strategy.as_deref().unwrap_or("classic")),
                strength_full: form.strength_full.unwrap_or(0.10),
                min_weight: form.min_weight.unwrap_or(0.20),
                date_begin,
                date_end,
            };
            let simulate_result = simulate_with_options(&options, &index_data_list);
            if simulate_result.profit_list.is_empty() {
                return Err(error::AppError::FailedWithMessage(
                    "日期区间内没有可用的指数数据".to_owned(),
                ));
            }
            Ok(axum::Json(simulate_result))
        }
    }
}

fn non_empty(value: Option<String>) -> Option<String> {
    value.map(|s| s.trim().to_owned()).filter(|s| !s.is_empty())
}
