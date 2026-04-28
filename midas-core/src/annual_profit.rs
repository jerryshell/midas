use crate::*;
use rayon::prelude::*;

pub fn list(profit_list: &[model::Profit]) -> Vec<model::AnnualProfit> {
    let year_set = profit_list
        .par_iter()
        .map(|item| {
            item.date
                .split('-')
                .next()
                .expect("date should contain at least one segment")
                .to_string()
        })
        .collect::<std::collections::BTreeSet<String>>();

    year_set
        .par_iter()
        .map(|year| {
            let mut iter = profit_list.iter().filter(|item| item.date.contains(year));
            if profit_list.iter().filter(|item| item.date.contains(year)).count() < 2 {
                return model::AnnualProfit {
                    year: year.to_string(),
                    index_profit: 0.0,
                    ma_profit: 0.0,
                };
            }
            let first = iter
                .next()
                .expect("iterator should have at least two elements");
            let last = iter
                .next_back()
                .expect("iterator should have at least two elements");
            model::AnnualProfit {
                year: year.to_string(),
                index_profit: last.close_point - first.close_point,
                ma_profit: last.value - first.value,
            }
        })
        .collect()
}
