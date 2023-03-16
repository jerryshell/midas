use rayon::prelude::*;

pub fn simulate(
    init_cash: f64,
    ma_days: usize,
    sell_ratio: f64,
    buy_ratio: f64,
    service_charge: f64,
    index_data_list: &[crate::model::IndexData],
) -> crate::model::SimulateResult {
    let mut simulate_result = crate::model::SimulateResult::default();

    if index_data_list.is_empty() {
        return simulate_result;
    }

    // profit_list & trade_list
    fill_profit_list_and_trade_list(
        init_cash,
        ma_days,
        sell_ratio,
        buy_ratio,
        service_charge,
        index_data_list,
        &mut simulate_result,
    );

    // index_final_profit_loss_ratio
    fill_index_final_profit_loss_ratio(index_data_list, &mut simulate_result);

    // ma_final_profit_loss_ratio
    fill_ma_final_profit_loss_ratio(init_cash, &mut simulate_result);

    // years
    fill_years(index_data_list, &mut simulate_result);

    // index_apr
    simulate_result.index_apr = (1.0 + simulate_result.index_final_profit_loss_ratio)
        .powf(1.0 / simulate_result.years)
        - 1.0;

    // ma_apr
    simulate_result.ma_apr =
        (1.0 + simulate_result.ma_final_profit_loss_ratio).powf(1.0 / simulate_result.years) - 1.0;

    // annual_profit_list
    simulate_result.annual_profit_list = crate::annual_profit::list(&simulate_result.profit_list);

    simulate_result
}

fn fill_years(
    index_data_list: &[crate::model::IndexData],
    simulate_result: &mut crate::model::SimulateResult,
) {
    let date_begin = &index_data_list.first().unwrap().date;
    let date_end = &index_data_list.last().unwrap().date;
    let date_begin = chrono::NaiveDate::parse_from_str(date_begin, "%Y-%m-%d").unwrap();
    let date_end = chrono::NaiveDate::parse_from_str(date_end, "%Y-%m-%d").unwrap();
    let duration = date_end.signed_duration_since(date_begin);
    let years = duration.num_days() as f64 / 365.0;
    simulate_result.years = years;
}

fn fill_ma_final_profit_loss_ratio(
    init_cash: f64,
    simulate_result: &mut crate::model::SimulateResult,
) {
    let last_value = simulate_result.profit_list.last().unwrap().value;
    let ma_final_profit_loss_ratio = (last_value - init_cash) / init_cash;
    simulate_result.ma_final_profit_loss_ratio = ma_final_profit_loss_ratio;
}

fn fill_index_final_profit_loss_ratio(
    index_data_list: &[crate::model::IndexData],
    simulate_result: &mut crate::model::SimulateResult,
) {
    let first_close_point = index_data_list.first().unwrap().close_point;
    let last_close_point = index_data_list.last().unwrap().close_point;
    let index_final_profit_loss_ratio = (last_close_point - first_close_point) / first_close_point;
    simulate_result.index_final_profit_loss_ratio = index_final_profit_loss_ratio;
}

fn fill_profit_list_and_trade_list(
    init_cash: f64,
    ma_days: usize,
    sell_ratio: f64,
    buy_ratio: f64,
    service_charge: f64,
    index_data_list: &[crate::model::IndexData],
    simulate_result: &mut crate::model::SimulateResult,
) {
    let mut cash = init_cash;
    let mut shares = 0.0;

    // profit_list
    let profit_list = index_data_list
        .iter()
        .enumerate()
        .map(|(current_index, index_data)| {
            let close_point = index_data.close_point;

            let ma = get_ma(current_index, ma_days, index_data_list);
            let max = get_max(current_index, ma_days, index_data_list);
            match ma.is_some() && max.is_some() {
                false => {
                    // do nothing
                }
                true => {
                    let increse_ratio = close_point / ma.unwrap();
                    let decrese_ratio = close_point / max.unwrap();

                    if increse_ratio >= buy_ratio {
                        // time to buy
                        if 0.0 == shares {
                            // buy
                            shares = cash / close_point;
                            cash = 0.0;
                            let trade = crate::model::Trade {
                                buy_date: index_data.date.clone(),
                                sell_date: r"N/A".to_owned(),
                                buy_close_point: index_data.close_point,
                                sell_close_point: 0.0,
                                profit_loss_ratio: 0.0,
                            };
                            simulate_result.trade_list.push(trade);
                        } else {
                            // hold shares, do nothing
                        }
                    } else if decrese_ratio <= sell_ratio {
                        // time to sell
                        if 0.0 == shares {
                            // no shares, do nothing
                        } else {
                            // sell
                            cash = close_point * shares * (1.0 - service_charge);
                            shares = 0.0;
                            let trade = simulate_result.trade_list.last_mut().unwrap();
                            trade.sell_date = index_data.date.clone();
                            trade.sell_close_point = index_data.close_point;
                            trade.profit_loss_ratio = (trade.sell_close_point
                                - trade.buy_close_point)
                                / trade.buy_close_point;
                        }
                    } else {
                        // do nothing
                    }
                }
            }

            let value = if shares == 0.0 {
                cash
            } else {
                close_point * shares
            };

            crate::model::Profit {
                date: index_data.date.clone(),
                close_point,
                value,
            }
        })
        .collect();

    simulate_result.profit_list = profit_list;
}

fn get_max(
    target_index: usize,
    days: usize,
    index_data_list: &[crate::model::IndexData],
) -> Option<f64> {
    if days == 0 || days > target_index {
        return None;
    }

    let begin_index = target_index - days;
    let end_index = target_index - 1;

    index_data_list[begin_index..=end_index]
        .par_iter()
        .map(|item| item.close_point)
        .max_by(|a, b| a.partial_cmp(b).unwrap())
}

fn get_ma(
    target_index: usize,
    days: usize,
    index_data_list: &[crate::model::IndexData],
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
    fn get_test_index_data_list() -> Vec<crate::model::IndexData> {
        crate::index_data::list_by_code("000300").unwrap()
    }

    mod simulate {
        #[test]
        fn test() {
            let index_data_list = crate::simulate::tests::get_test_index_data_list();
            let simulate_result =
                crate::simulate::simulate(1000.0, 30, 0.95, 1.05, 0.0, &index_data_list);
            assert_eq!(index_data_list.len(), simulate_result.profit_list.len());
            assert_eq!(
                9449.059143002818,
                simulate_result.profit_list.last().unwrap().value
            );
        }
    }

    mod get_max {
        #[test]
        fn test() {
            let index_data_list = crate::simulate::tests::get_test_index_data_list();
            let max = crate::simulate::get_max(100, 30, &index_data_list);
            assert_eq!(Some(943.98), max);
        }
    }

    mod get_ma {
        #[test]
        fn test() {
            let index_data_list = crate::simulate::tests::get_test_index_data_list();
            let ma = crate::simulate::get_ma(100, 30, &index_data_list);
            assert_eq!(Some(884.3420000000001), ma);
        }
    }
}
