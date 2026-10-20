use crate::*;
use ndarray::Array1;
use rayon::prelude::*;
use stochastic_rs_stats::realized::ewma::ewma_variance;

/// 策略模式。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StrategyMode {
    /// 经典 Midas：突破买入、从 N 日高点回撤卖出、全仓/空仓。
    Classic,
    /// 强度仓位：突破越强仓位越高；收盘跌破 MA 离场。
    Strength,
}

impl StrategyMode {
    pub fn parse(value: &str) -> Self {
        match value.trim().to_ascii_lowercase().as_str() {
            "strength" | "strong" => Self::Strength,
            _ => Self::Classic,
        }
    }
}

/// 决策频率。日频用于研究；周频/月频用于降低跟盘操作量。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DecisionFrequency {
    Daily,
    Weekly,
    Monthly,
}

impl DecisionFrequency {
    pub fn parse(value: &str) -> Self {
        match value.trim().to_ascii_lowercase().as_str() {
            "weekly" | "week" => Self::Weekly,
            "monthly" | "month" => Self::Monthly,
            _ => Self::Daily,
        }
    }
}

/// 一次回测的完整参数。
///
/// `simulate` 保留旧接口；新接口通过 [`simulate_with_options`] 传入这些参数。
#[derive(Debug, Clone)]
pub struct SimulateOptions {
    pub init_cash: f64,
    pub ma_days: usize,
    pub sell_ratio: f64,
    pub buy_ratio: f64,
    /// 买入费率（佣金等），双边费率分开后可以正确表达 A 股的卖出印花税。
    pub buy_service_charge: f64,
    /// 卖出费率（佣金 + 印花税等）。
    pub sell_service_charge: f64,
    /// 单边滑点，买卖都收。
    pub slippage: f64,
    /// 闲置现金的年化收益率（货币基金/逆回购）。
    pub cash_yield: f64,
    /// 持有期间的年化股息率。价格指数不含分红，用它近似全收益。
    pub dividend_yield: f64,
    /// 0 = 当日收盘成交；1 = T 日收盘信号、T+1 收盘成交。
    pub execution_delay: usize,
    /// >0 时按 EWMA 预测波动率做仓位目标；0 = 全仓/空仓。
    pub vol_target: f64,
    /// 计算 EWMA 波动率前至少需要的交易日数。
    pub vol_lookback: usize,
    /// 波动率目标下的最大杠杆（1.0 = 不加杠杆）。
    pub max_leverage: f64,
    /// 现金为负（加杠杆）时的年化融资成本。
    pub margin_rate: f64,
    /// 持仓权重变化小于该值时不再平衡，降低换手。
    pub rebalance_band: f64,
    pub date_begin: Option<String>,
    pub date_end: Option<String>,
    /// 策略模式。
    pub strategy: StrategyMode,
    /// 强度仓位模式下，收盘价高于 MA 多少比例时达到满仓。
    pub strength_full: f64,
    /// 强度仓位模式下持仓期间的最低仓位。
    pub min_weight: f64,
    /// 决策频率。周频/月频只在周期最后一个交易日更新目标。
    pub decision_frequency: DecisionFrequency,
}

impl SimulateOptions {
    /// 旧版 `simulate` 的行为：买入免费、卖出收 `service_charge`、无现金收益/股息、当日收盘成交、全仓。
    pub fn legacy(
        init_cash: f64,
        ma_days: usize,
        sell_ratio: f64,
        buy_ratio: f64,
        service_charge: f64,
    ) -> Self {
        Self {
            init_cash,
            ma_days,
            sell_ratio,
            buy_ratio,
            buy_service_charge: 0.0,
            sell_service_charge: service_charge,
            slippage: 0.0,
            cash_yield: 0.0,
            dividend_yield: 0.0,
            execution_delay: 0,
            vol_target: 0.0,
            vol_lookback: 20,
            max_leverage: 1.0,
            margin_rate: 0.0,
            rebalance_band: 0.0,
            date_begin: None,
            date_end: None,
            strategy: StrategyMode::Classic,
            strength_full: 0.10,
            min_weight: 0.20,
            decision_frequency: DecisionFrequency::Daily,
        }
    }

    fn sanitized(&self) -> Self {
        let mut out = self.clone();
        out.init_cash = out.init_cash.max(0.0);
        out.ma_days = out.ma_days.clamp(1, 1000);
        out.sell_ratio = out.sell_ratio.clamp(0.0, 1.0);
        out.buy_ratio = out.buy_ratio.max(0.0);
        out.buy_service_charge = out.buy_service_charge.clamp(0.0, 0.2);
        out.sell_service_charge = out.sell_service_charge.clamp(0.0, 0.2);
        out.slippage = out.slippage.clamp(0.0, 0.2);
        out.cash_yield = out.cash_yield.clamp(-0.2, 0.5);
        out.dividend_yield = out.dividend_yield.clamp(-0.2, 0.5);
        out.execution_delay = out.execution_delay.min(5);
        out.vol_target = out.vol_target.clamp(0.0, 5.0);
        out.vol_lookback = out.vol_lookback.clamp(2, 1000);
        out.max_leverage = out.max_leverage.clamp(1.0, 5.0);
        out.margin_rate = out.margin_rate.clamp(0.0, 1.0);
        out.rebalance_band = out.rebalance_band.clamp(0.0, 0.5);
        out.strength_full = out.strength_full.clamp(0.01, 1.0);
        out.min_weight = out.min_weight.clamp(0.0, 1.0);
        out
    }
}

#[derive(Debug, Clone)]
struct Entry {
    price: f64,
    buy_cost: f64,
}

/// 旧接口，保持既有调用方和测试不变。
pub fn simulate(
    init_cash: f64,
    ma_days: usize,
    sell_ratio: f64,
    buy_ratio: f64,
    service_charge: f64,
    index_data_list: &[model::IndexData],
) -> model::SimulateResult {
    let options =
        SimulateOptions::legacy(init_cash, ma_days, sell_ratio, buy_ratio, service_charge);
    simulate_with_options(&options, index_data_list)
}

pub fn simulate_with_options(
    options: &SimulateOptions,
    index_data_list: &[model::IndexData],
) -> model::SimulateResult {
    let mut simulate_result = model::SimulateResult::default();
    let options = options.sanitized();

    if index_data_list.is_empty() || options.init_cash <= 0.0 {
        return simulate_result;
    }

    let (begin_index, end_index) = match date_range(&options, index_data_list) {
        Some(v) => v,
        None => return simulate_result,
    };

    // 指标用完整历史计算，日期区间只影响模拟区间，避免区间开头没有 MA 暖机数据。
    let vol = if options.vol_target > 0.0 {
        ewma_annual_vol(
            &index_data_list
                .iter()
                .map(|x| x.close_point)
                .collect::<Vec<_>>(),
            options.vol_lookback,
        )
    } else {
        Vec::new()
    };

    let buy_cost = options.buy_service_charge + options.slippage;
    let sell_cost = options.sell_service_charge + options.slippage;

    let mut cash = options.init_cash;
    let mut shares = 0.0_f64;
    let mut holding = false;
    let mut effective_target = 0.0_f64;
    let mut pending_target: Option<f64> = None;
    let mut entry: Option<Entry> = None;
    let mut profit_list: Vec<model::Profit> = Vec::with_capacity(end_index - begin_index + 1);
    let mut trade_list: Vec<model::Trade> = Vec::new();
    let mut total_fees = 0.0;
    let mut total_dividends = 0.0;
    let mut total_interest = 0.0;

    for i in begin_index..=end_index {
        let index_data = &index_data_list[i];
        let price = index_data.close_point;
        if !price.is_finite() || price <= 0.0 {
            continue;
        }

        // T+1：执行昨天收盘产生的目标权重。
        if let Some(target) = pending_target.take() {
            rebalance(
                &mut cash,
                &mut shares,
                target,
                price,
                &index_data.date,
                buy_cost,
                sell_cost,
                options.rebalance_band,
                &mut trade_list,
                &mut entry,
                &mut total_fees,
            );
        }

        let ma = get_ma(i, options.ma_days, index_data_list);
        let mut target = match options.strategy {
            StrategyMode::Classic => {
                // 与原版一致：买入条件优先于卖出条件，避免同一天既买又卖。
                if let (Some(ma), Some(max)) = (ma, get_max(i, options.ma_days, index_data_list)) {
                    let buy = price / ma >= options.buy_ratio;
                    let sell = price / max <= options.sell_ratio;
                    if buy {
                        if !holding {
                            holding = true;
                        }
                    } else if holding && sell {
                        holding = false;
                    }
                }
                if holding { 1.0 } else { 0.0 }
            }
            StrategyMode::Strength => {
                if let Some(ma) = ma {
                    if !holding && price / ma >= options.buy_ratio {
                        holding = true;
                    } else if holding && price < ma {
                        holding = false;
                    }
                    if holding {
                        ((price / ma - 1.0) / options.strength_full).clamp(options.min_weight, 1.0)
                    } else {
                        0.0
                    }
                } else {
                    0.0
                }
            }
        };

        if target > 0.0 && options.vol_target > 0.0 {
            let sigma = vol.get(i).copied().unwrap_or(0.0);
            target = if sigma > 0.0 {
                (target * (options.vol_target / sigma)).min(options.max_leverage)
            } else {
                0.0
            };
        }

        // 周频/月频只在周期最后一个交易日更新目标，降低跟盘操作量。
        let target = if options.decision_frequency == DecisionFrequency::Daily {
            target
        } else {
            if is_period_end(index_data_list, i, options.decision_frequency) {
                effective_target = target;
            }
            effective_target
        };

        if options.execution_delay == 0 {
            rebalance(
                &mut cash,
                &mut shares,
                target,
                price,
                &index_data.date,
                buy_cost,
                sell_cost,
                options.rebalance_band,
                &mut trade_list,
                &mut entry,
                &mut total_fees,
            );
        } else {
            pending_target = Some(target);
        }

        // 第一天不计息，保证期初净值等于初始现金。
        if i > begin_index {
            if cash > 0.0 {
                let interest = cash * options.cash_yield / 252.0;
                cash += interest;
                total_interest += interest;
            } else if cash < 0.0 {
                let interest = cash * options.margin_rate / 252.0;
                cash += interest;
                total_interest += interest;
            }

            // 股息按持仓市值逐日计提并再投资，近似全收益指数。
            if shares > 0.0 && options.dividend_yield != 0.0 {
                let dividend = shares * price * options.dividend_yield / 252.0;
                shares += dividend / price;
                total_dividends += dividend;
            }
        }

        let value = cash + shares * price;
        let position = if value > 0.0 {
            shares * price / value
        } else {
            0.0
        };
        profit_list.push(model::Profit {
            date: index_data.date.clone(),
            close_point: price,
            value,
            position,
        });
    }

    if profit_list.is_empty() {
        return simulate_result;
    }

    // 最后一笔仍持仓：按最后收盘价盯市，保持旧版输出的行为。
    let last_close = profit_list.last().expect("not empty").close_point;
    if let Some(last_trade) = trade_list
        .last_mut()
        .filter(|trade| trade.sell_date == "N/A")
    {
        last_trade.sell_close_point = last_close;
        last_trade.profit_loss_ratio = last_close / last_trade.buy_close_point - 1.0;
        last_trade.net_profit_loss_ratio = (last_close * (1.0 - sell_cost))
            / (last_trade.buy_close_point * (1.0 + buy_cost))
            - 1.0;
    }

    simulate_result.profit_list = profit_list;
    simulate_result.trade_list = trade_list;
    simulate_result.total_fees = total_fees;
    simulate_result.total_dividends = total_dividends;
    simulate_result.total_interest = total_interest;

    fill_years(
        begin_index,
        end_index,
        index_data_list,
        &mut simulate_result,
    );
    fill_index_final_profit_loss_ratio(
        begin_index,
        end_index,
        index_data_list,
        &mut simulate_result,
    );
    fill_ma_final_profit_loss_ratio(options.init_cash, &mut simulate_result);

    simulate_result.index_apr = apr(
        simulate_result.index_final_profit_loss_ratio,
        simulate_result.years,
    );
    simulate_result.ma_apr = apr(
        simulate_result.ma_final_profit_loss_ratio,
        simulate_result.years,
    );

    fill_risk_metrics(
        begin_index,
        end_index,
        index_data_list,
        options.init_cash,
        &mut simulate_result,
    );
    simulate_result.annual_profit_list = annual_profit::list(&simulate_result.profit_list);

    simulate_result
}

fn is_period_end(data: &[model::IndexData], index: usize, frequency: DecisionFrequency) -> bool {
    use chrono::Datelike;

    if frequency == DecisionFrequency::Daily {
        return true;
    }
    let current = chrono::NaiveDate::parse_from_str(&data[index].date, "%Y-%m-%d").ok();
    let Some(current) = current else {
        return false;
    };

    if let Some(next) = data
        .get(index + 1)
        .and_then(|item| chrono::NaiveDate::parse_from_str(&item.date, "%Y-%m-%d").ok())
    {
        return match frequency {
            DecisionFrequency::Weekly => current.iso_week() != next.iso_week(),
            DecisionFrequency::Monthly => current.month() != next.month(),
            DecisionFrequency::Daily => true,
        };
    }

    // 最后一个数据点：周五视为周收盘；月末视为月收盘。
    match frequency {
        DecisionFrequency::Weekly => current.weekday() == chrono::Weekday::Fri,
        DecisionFrequency::Monthly => current
            .succ_opt()
            .map(|next| next.month() != current.month())
            .unwrap_or(true),
        DecisionFrequency::Daily => true,
    }
}

fn date_range(options: &SimulateOptions, data: &[model::IndexData]) -> Option<(usize, usize)> {
    let begin = options
        .date_begin
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let end = options
        .date_end
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    if end.is_some_and(|end| data.first().is_some_and(|x| x.date.as_str() > end)) {
        return None;
    }

    let begin_index = match begin {
        Some(begin) => data.iter().position(|x| x.date.as_str() >= begin)?,
        None => 0,
    };
    let end_index = match end {
        Some(end) => data.iter().rposition(|x| x.date.as_str() <= end)?,
        None => data.len().checked_sub(1)?,
    };

    if begin_index > end_index {
        None
    } else {
        Some((begin_index, end_index))
    }
}

fn apr(total_return: f64, years: f64) -> f64 {
    if years <= 0.0 || !total_return.is_finite() || total_return <= -1.0 {
        return 0.0;
    }
    (1.0 + total_return).powf(1.0 / years) - 1.0
}

fn ewma_annual_vol(closes: &[f64], lookback: usize) -> Vec<f64> {
    let mut vol = vec![0.0; closes.len()];
    if closes.len() < 3 {
        return vol;
    }

    let returns = Array1::from_iter(
        closes
            .windows(2)
            .map(|w| (w[1] / w[0]).ln())
            .filter(|r| r.is_finite()),
    );
    if returns.len() < 3 {
        return vol;
    }

    // RiskMetrics 日频 λ=0.94。variance[t] 使用到 r[t-1] 为止的信息，是因果的。
    let ewma = ewma_variance(returns.view(), 0.94);
    let min_index = lookback.max(2);
    for (i, vol_i) in vol.iter_mut().enumerate().skip(min_index) {
        let variance = if i < ewma.variance.len() {
            ewma.variance[i]
        } else {
            ewma.forecast
        };
        if variance.is_finite() && variance > 0.0 {
            *vol_i = (variance * 252.0).sqrt();
        }
    }
    vol
}

#[allow(clippy::too_many_arguments)]
fn rebalance(
    cash: &mut f64,
    shares: &mut f64,
    target: f64,
    price: f64,
    date: &str,
    buy_cost: f64,
    sell_cost: f64,
    band: f64,
    trade_list: &mut Vec<model::Trade>,
    entry: &mut Option<Entry>,
    total_fees: &mut f64,
) {
    let equity = *cash + *shares * price;
    if !equity.is_finite() || equity <= 0.0 {
        return;
    }
    let value_now = *shares * price;
    let weight_now = value_now / equity;
    let target = target.clamp(0.0, 5.0);

    if target <= 0.0 {
        if weight_now > 1e-12 {
            let proceeds = value_now;
            let cost = proceeds * sell_cost;
            *cash += proceeds - cost;
            *shares = 0.0;
            *total_fees += cost;
            close_trade(trade_list, entry, price, date, sell_cost);
        }
        return;
    }

    if weight_now <= 1e-12 {
        // 开仓：target 可以小于 1（波动率目标），但不会超过最大杠杆。
        let target_value = target * equity;
        let max_notional = if target <= 1.0 {
            (*cash / (1.0 + buy_cost)).max(0.0)
        } else {
            f64::INFINITY
        };
        let notional = target_value.min(max_notional).max(0.0);
        if notional <= 0.0 {
            return;
        }
        let cost = notional * buy_cost;
        *cash -= notional + cost;
        *shares += notional / price;
        *total_fees += cost;
        *entry = Some(Entry { price, buy_cost });
        trade_list.push(model::Trade {
            buy_date: date.to_owned(),
            sell_date: "N/A".to_owned(),
            buy_close_point: price,
            sell_close_point: 0.0,
            buy_weight: target,
            profit_loss_ratio: 0.0,
            net_profit_loss_ratio: 0.0,
        });
        return;
    }

    if (target - weight_now).abs() < band {
        return;
    }

    let target_value = target * equity;
    let delta = target_value - value_now;
    if delta > 0.0 {
        let notional = if target <= 1.0 {
            delta.min((*cash / (1.0 + buy_cost)).max(0.0))
        } else {
            delta
        };
        if notional <= 0.0 {
            return;
        }
        let cost = notional * buy_cost;
        *cash -= notional + cost;
        *shares += notional / price;
        *total_fees += cost;
    } else {
        let proceeds = -delta;
        let cost = proceeds * sell_cost;
        *cash += proceeds - cost;
        *shares -= proceeds / price;
        *total_fees += cost;
    }
}

fn close_trade(
    trade_list: &mut [model::Trade],
    entry: &mut Option<Entry>,
    price: f64,
    date: &str,
    sell_cost: f64,
) {
    let Some(entry) = entry.take() else {
        return;
    };
    let Some(trade) = trade_list.last_mut() else {
        return;
    };
    trade.sell_date = date.to_owned();
    trade.sell_close_point = price;
    trade.profit_loss_ratio = price / entry.price - 1.0;
    trade.net_profit_loss_ratio =
        (price * (1.0 - sell_cost)) / (entry.price * (1.0 + entry.buy_cost)) - 1.0;
}

fn fill_years(
    begin_index: usize,
    end_index: usize,
    index_data_list: &[model::IndexData],
    simulate_result: &mut model::SimulateResult,
) {
    let date_begin = &index_data_list[begin_index].date;
    let date_end = &index_data_list[end_index].date;
    let date_begin = chrono::NaiveDate::parse_from_str(date_begin, "%Y-%m-%d").ok();
    let date_end = chrono::NaiveDate::parse_from_str(date_end, "%Y-%m-%d").ok();
    simulate_result.years = match (date_begin, date_end) {
        (Some(begin), Some(end)) => end.signed_duration_since(begin).num_days() as f64 / 365.25,
        _ => 0.0,
    };
}

fn fill_ma_final_profit_loss_ratio(init_cash: f64, simulate_result: &mut model::SimulateResult) {
    let last_value = simulate_result
        .profit_list
        .last()
        .expect("profit_list should not be empty")
        .value;
    simulate_result.ma_final_profit_loss_ratio = (last_value - init_cash) / init_cash;
}

fn fill_index_final_profit_loss_ratio(
    begin_index: usize,
    end_index: usize,
    index_data_list: &[model::IndexData],
    simulate_result: &mut model::SimulateResult,
) {
    let first_close = index_data_list[begin_index].close_point;
    let last_close = index_data_list[end_index].close_point;
    simulate_result.index_final_profit_loss_ratio = (last_close - first_close) / first_close;
}

fn fill_risk_metrics(
    begin_index: usize,
    end_index: usize,
    index_data_list: &[model::IndexData],
    init_cash: f64,
    simulate_result: &mut model::SimulateResult,
) {
    let values: Vec<f64> = simulate_result
        .profit_list
        .iter()
        .map(|x| x.value)
        .collect();
    let returns = daily_returns(&values);
    simulate_result.ma_volatility = annualized_vol(&returns);
    simulate_result.ma_sharpe = sharpe(&returns, simulate_result.ma_volatility);
    simulate_result.ma_max_drawdown = max_drawdown(&values).unwrap_or(0.0);
    simulate_result.ma_calmar = if simulate_result.ma_max_drawdown.abs() > 1e-12 {
        simulate_result.ma_apr / simulate_result.ma_max_drawdown.abs()
    } else {
        0.0
    };
    simulate_result.ma_exposure = if simulate_result.profit_list.is_empty() {
        0.0
    } else {
        simulate_result
            .profit_list
            .iter()
            .map(|x| x.position)
            .sum::<f64>()
            / simulate_result.profit_list.len() as f64
    };

    // 指数基准：期初等额买入并持有，不含股息。
    let first_close = index_data_list[begin_index].close_point;
    let index_values: Vec<f64> = index_data_list[begin_index..=end_index]
        .iter()
        .map(|x| init_cash * x.close_point / first_close)
        .collect();
    let index_returns = daily_returns(&index_values);
    let index_vol = annualized_vol(&index_returns);
    simulate_result.index_sharpe = sharpe(&index_returns, index_vol);
    simulate_result.index_max_drawdown = max_drawdown(&index_values).unwrap_or(0.0);

    let closed: Vec<&model::Trade> = simulate_result
        .trade_list
        .iter()
        .filter(|t| t.sell_date != "N/A")
        .collect();
    simulate_result.trade_count = simulate_result.trade_list.len();
    if closed.is_empty() {
        simulate_result.win_rate = 0.0;
        simulate_result.profit_factor = 0.0;
        return;
    }
    let wins = closed
        .iter()
        .filter(|t| t.net_profit_loss_ratio > 0.0)
        .count();
    simulate_result.win_rate = wins as f64 / closed.len() as f64;
    let gross_profit: f64 = closed
        .iter()
        .filter(|t| t.net_profit_loss_ratio > 0.0)
        .map(|t| t.net_profit_loss_ratio)
        .sum();
    let gross_loss: f64 = closed
        .iter()
        .filter(|t| t.net_profit_loss_ratio < 0.0)
        .map(|t| -t.net_profit_loss_ratio)
        .sum();
    simulate_result.profit_factor = if gross_loss > 1e-12 {
        gross_profit / gross_loss
    } else if gross_profit > 0.0 {
        999.0
    } else {
        0.0
    };
}

fn daily_returns(values: &[f64]) -> Vec<f64> {
    values
        .windows(2)
        .filter_map(|w| {
            if w[0] > 0.0 && w[1].is_finite() {
                Some(w[1] / w[0] - 1.0)
            } else {
                None
            }
        })
        .collect()
}

fn annualized_vol(returns: &[f64]) -> f64 {
    if returns.len() < 2 {
        return 0.0;
    }
    let mean = returns.iter().sum::<f64>() / returns.len() as f64;
    let variance =
        returns.iter().map(|r| (r - mean).powi(2)).sum::<f64>() / (returns.len() - 1) as f64;
    variance.max(0.0).sqrt() * 252.0_f64.sqrt()
}

fn sharpe(returns: &[f64], vol: f64) -> f64 {
    if returns.is_empty() || vol <= 1e-12 {
        return 0.0;
    }
    let mean = returns.iter().sum::<f64>() / returns.len() as f64;
    mean * 252.0 / vol
}

fn max_drawdown(values: &[f64]) -> Option<f64> {
    let mut peak = f64::NEG_INFINITY;
    let mut mdd = 0.0_f64;
    for &v in values {
        if !v.is_finite() {
            continue;
        }
        if v > peak {
            peak = v;
        }
        if peak > 0.0 {
            mdd = mdd.min(v / peak - 1.0);
        }
    }
    Some(mdd)
}

pub fn get_max(
    target_index: usize,
    days: usize,
    index_data_list: &[model::IndexData],
) -> Option<f64> {
    if days == 0 || days > target_index {
        return None;
    }

    let begin_index = target_index - days;
    let end_index = target_index - 1;

    index_data_list[begin_index..=end_index]
        .par_iter()
        .map(|item| item.close_point)
        .max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
}

pub fn get_ma(
    target_index: usize,
    days: usize,
    index_data_list: &[model::IndexData],
) -> Option<f64> {
    if days == 0 || days > target_index {
        return None;
    }

    let begin_index = target_index - days;
    let end_index = target_index - 1;

    let sum = index_data_list[begin_index..=end_index]
        .par_iter()
        .map(|item| item.close_point)
        .sum::<f64>();

    Some(sum / days as f64)
}

#[cfg(test)]
mod tests {
    use crate::*;

    fn get_test_index_data_list() -> Vec<model::IndexData> {
        index_data::list_by_code("000300").unwrap()
    }

    #[test]
    fn test_simulate() {
        let index_data_list = simulate::tests::get_test_index_data_list();
        let simulate_result = simulate::simulate(1000.0, 30, 0.95, 1.05, 0.0, &index_data_list);
        assert_eq!(index_data_list.len(), simulate_result.profit_list.len());
        assert_eq!(
            9449.059143002818,
            simulate_result.profit_list.last().unwrap().value
        );
    }

    #[test]
    fn test_simulate_costs_reduce_value() {
        let index_data_list = simulate::tests::get_test_index_data_list();
        let options = simulate::SimulateOptions {
            buy_service_charge: 0.001,
            sell_service_charge: 0.001,
            slippage: 0.001,
            ..simulate::SimulateOptions::legacy(1000.0, 30, 0.95, 1.05, 0.0)
        };
        let with_costs = simulate::simulate_with_options(&options, &index_data_list);
        let without_costs = simulate::simulate(1000.0, 30, 0.95, 1.05, 0.0, &index_data_list);
        assert!(
            with_costs.profit_list.last().unwrap().value
                < without_costs.profit_list.last().unwrap().value
        );
        assert!(with_costs.total_fees > 0.0);
    }

    #[test]
    fn test_simulate_cash_yield() {
        let index_data_list = simulate::tests::get_test_index_data_list();
        let options = simulate::SimulateOptions {
            cash_yield: 0.05,
            ..simulate::SimulateOptions::legacy(1000.0, 30, 0.95, 1.05, 0.0)
        };
        let with_yield = simulate::simulate_with_options(&options, &index_data_list);
        let without_yield = simulate::simulate(1000.0, 30, 0.95, 1.05, 0.0, &index_data_list);
        assert!(
            with_yield.profit_list.last().unwrap().value
                > without_yield.profit_list.last().unwrap().value
        );
        assert!(with_yield.total_interest > 0.0);
    }

    #[test]
    fn test_simulate_vol_target() {
        let index_data_list = simulate::tests::get_test_index_data_list();
        let options = simulate::SimulateOptions {
            vol_target: 0.20,
            vol_lookback: 20,
            max_leverage: 1.0,
            ..simulate::SimulateOptions::legacy(1000.0, 30, 0.95, 1.05, 0.0)
        };
        let result = simulate::simulate_with_options(&options, &index_data_list);
        assert!(result.ma_exposure > 0.0);
        assert!(result.ma_exposure <= 1.0 + 1e-9);
        assert!(result.ma_volatility.is_finite());
    }

    #[test]
    fn test_date_range_uses_warmup() {
        let index_data_list = simulate::tests::get_test_index_data_list();
        let options = simulate::SimulateOptions {
            date_begin: Some("2020-01-02".to_owned()),
            date_end: Some("2021-12-31".to_owned()),
            ..simulate::SimulateOptions::legacy(1000.0, 30, 0.95, 1.05, 0.0)
        };
        let result = simulate::simulate_with_options(&options, &index_data_list);
        assert!(result.profit_list.len() > 400);
        assert_eq!(result.profit_list.first().unwrap().date, "2020-01-02");
        assert_eq!(result.profit_list.last().unwrap().date, "2021-12-31");
    }

    #[test]
    fn test_simulate_strength_mode() {
        let index_data_list = simulate::tests::get_test_index_data_list();
        let classic = simulate::simulate(1000.0, 30, 0.95, 1.05, 0.0, &index_data_list);
        let options = simulate::SimulateOptions {
            strategy: simulate::StrategyMode::Strength,
            strength_full: 0.10,
            min_weight: 0.20,
            ..simulate::SimulateOptions::legacy(1000.0, 30, 0.95, 1.05, 0.0)
        };
        let strength = simulate::simulate_with_options(&options, &index_data_list);
        assert!(strength.ma_exposure > 0.0);
        assert!(strength.ma_exposure <= 1.0 + 1e-9);
        assert!(strength.ma_sharpe.is_finite());
        assert!(
            (strength.profit_list.last().unwrap().value
                - classic.profit_list.last().unwrap().value)
                .abs()
                > 1e-6
        );
    }

    #[test]
    fn test_simulate_weekly_frequency() {
        let index_data_list = simulate::tests::get_test_index_data_list();
        let daily = simulate::simulate(1000.0, 30, 0.95, 1.05, 0.0, &index_data_list);
        let options = simulate::SimulateOptions {
            decision_frequency: simulate::DecisionFrequency::Weekly,
            ..simulate::SimulateOptions::legacy(1000.0, 30, 0.95, 1.05, 0.0)
        };
        let weekly = simulate::simulate_with_options(&options, &index_data_list);
        assert_eq!(weekly.profit_list.len(), daily.profit_list.len());
        assert!(weekly.trade_count <= daily.trade_count);
        assert!(weekly.ma_sharpe.is_finite());
    }

    #[test]
    fn test_get_max() {
        let index_data_list = simulate::tests::get_test_index_data_list();
        let max = simulate::get_max(100, 30, &index_data_list);
        assert_eq!(Some(943.98), max);
    }

    #[test]
    fn test_get_ma() {
        let index_data_list = simulate::tests::get_test_index_data_list();
        let ma = simulate::get_ma(100, 30, &index_data_list);
        assert_eq!(Some(884.3420000000001), ma);
    }
}
