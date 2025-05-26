use crate::*;
use rayon::prelude::*;

pub fn list(profit_list: &[model::Profit]) -> Vec<model::AnnualProfit> {
    let year_set = profit_list
        .par_iter()
        .map(|item| item.date.split('-').next().unwrap().to_string())
        .collect::<std::collections::BTreeSet<String>>();

    year_set
        .par_iter()
        .map(|year| {
            let mut iter = profit_list.iter().filter(|item| item.date.contains(year));
            if iter.clone().count() < 2 {
                return model::AnnualProfit {
                    year: year.to_string(),
                    index_profit: 0.0,
                    ma_profit: 0.0,
                };
            }
            let first = iter.next().unwrap();
            let last = iter.next_back().unwrap();
            model::AnnualProfit {
                year: year.to_string(),
                index_profit: last.close_point - first.close_point,
                ma_profit: last.value - first.value,
            }
        })
        .collect()
}
