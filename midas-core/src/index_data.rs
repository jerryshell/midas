pub fn list_by_code(
    code: &str,
) -> Result<Vec<crate::model::IndexData>, Box<dyn std::error::Error>> {
    let file = std::fs::File::open(format!("./index-data/{}.json", code))?;
    let reader = std::io::BufReader::new(file);
    let mut index_data_list = serde_json::from_reader::<_, Vec<crate::model::IndexData>>(reader)?;
    index_data_list.sort_by(|a, b| a.date.cmp(&b.date));
    Ok(index_data_list)
}

#[cfg(test)]
mod tests {
    mod list_by_code {
        #[test]
        fn test() {
            let code = "000300";
            let index_data_list =
                crate::index_data::list_by_code(code).expect("get_index_data_by_code() error");
            assert_eq!(index_data_list.len(), 4418);
            assert_eq!(index_data_list[0].date, "2005-01-04");
            assert_eq!(index_data_list[0].close_point, 994.77);
        }
    }
}
