pub fn simulate(
    ma_days: usize,
    sell_rate: f64,
    buy_rate: f64,
    service_charge: f64,
    index_data_list: &[crate::model::IndexData],
) -> crate::model::SimulateResult {
    let mut simulate_result = crate::model::SimulateResult::default();

    if index_data_list.is_empty() {
        return simulate_result;
    }

    let init_cash = 1000.0;
    let mut cash = init_cash;
    let mut share = 0.0;
    let mut value = 0.0;

    let profit_list = index_data_list
        .iter()
        .enumerate()
        .map(|(current_index, index_data)| {
            let close_point = index_data.close_point;

            match get_ma(current_index, ma_days, index_data_list) {
                None => {
                    // if ma is None, do nothing
                }
                Some(ma) => match get_max(current_index, ma_days, index_data_list) {
                    None => {
                        // if max is None, do nothing
                    }
                    Some(max) => {
                        let increse_rate = close_point / ma;
                        let decrese_rate = close_point / max;

                        if increse_rate >= buy_rate {
                            if 0.0 == share {
                                // buy
                                share = cash / close_point;
                                cash = 0.0;
                                let trade = crate::model::Trade {
                                    buy_date: index_data.date.clone(),
                                    sell_date: r"N\A".to_owned(),
                                    buy_close_point: index_data.close_point,
                                    sell_close_point: 0.0,
                                    profit_loss_ratio: 0.0,
                                };
                                simulate_result.trade_list.push(trade);
                            }
                        } else if decrese_rate <= sell_rate {
                            if 0.0 != share {
                                // sell
                                cash = close_point * share * (1.0 - service_charge);
                                share = 0.0;
                                let trade = simulate_result.trade_list.last_mut().unwrap();
                                trade.sell_date = index_data.date.clone();
                                trade.sell_close_point = index_data.close_point;
                                trade.profit_loss_ratio = (trade.sell_close_point
                                    - trade.buy_close_point)
                                    / trade.buy_close_point;
                            }
                        } else {
                            // hold the share, do nothing
                        }
                    }
                },
            };

            if share != 0.0 {
                value = close_point * share;
            } else {
                value = cash;
            }

            crate::model::Profit {
                date: index_data.date.clone(),
                close_point,
                value,
            }
        })
        .collect();

    simulate_result.profit_list = profit_list;
    simulate_result
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
        .iter()
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
        .iter()
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
            let simulate_result = crate::simulate::simulate(30, 0.95, 1.05, 0.0, &index_data_list);
            assert_eq!(index_data_list.len(), simulate_result.profit_list.len());
            assert_eq!(
                9995.847799430787,
                simulate_result.profit_list.last().unwrap().value
            );
        }
    }

    mod get_max {
        #[test]
        fn test() {
            let index_data_list = crate::simulate::tests::get_test_index_data_list();
            let max = crate::simulate::get_max(100, 30, &index_data_list);
            assert_eq!(Some(954.5), max);
        }
    }

    mod get_ma {
        #[test]
        fn test() {
            let index_data_list = crate::simulate::tests::get_test_index_data_list();
            let ma = crate::simulate::get_ma(100, 30, &index_data_list);
            assert_eq!(Some(920.8453333333331), ma);
        }
    }
}
