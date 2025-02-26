use crate::*;

pub fn list_by_code(code: &str) -> Result<Vec<model::IndexData>, Box<dyn std::error::Error>> {
    let file = std::fs::File::open(format!("index-data/{}.json", code))?;
    let reader = std::io::BufReader::new(file);
    let mut index_data_list = serde_json::from_reader::<_, Vec<model::IndexData>>(reader)?;
    index_data_list.sort_by(|a, b| a.date.cmp(&b.date));
    Ok(index_data_list)
}

#[cfg(test)]
mod tests {
    use crate::*;

    #[test]
    fn test_list_by_code() {
        let index_data_list = index_data::list_by_code("000300").unwrap();
        assert_eq!(index_data_list.len(), 4419);
        assert_eq!(index_data_list[0].date, "2005-01-04");
        assert_eq!(index_data_list[0].close_point, 982.79);
    }
}
