pub fn list(profit_list: &[crate::model::Profit]) -> Vec<crate::model::AnnualProfit> {
    let year_list = profit_list
        .iter()
        .map(|item| item.date.clone().split('-').next().unwrap().to_string())
        .collect::<std::collections::BTreeSet<String>>();

    year_list
        .iter()
        .map(|year| {
            let mut iter = profit_list.iter().filter(|item| item.date.contains(year));
            let first = iter.next().unwrap();
            let last = iter.last().unwrap();
            crate::model::AnnualProfit {
                year: year.to_string(),
                index_profit: last.close_point - first.close_point,
                ma_profit: last.value - first.value,
            }
        })
        .collect()
}
