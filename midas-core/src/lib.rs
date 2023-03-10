pub mod model;

pub fn get_index_code_list() -> Result<Vec<crate::model::IndexCode>, Box<dyn std::error::Error>> {
    let file = std::fs::File::open("./index-data/codes.json")?;
    let reader = std::io::BufReader::new(file);
    let index_code_list = serde_json::from_reader(reader)?;
    Ok(index_code_list)
}

pub fn get_index_data_list_by_code(
    code: &str,
) -> Result<Vec<crate::model::IndexData>, Box<dyn std::error::Error>> {
    let file = std::fs::File::open(format!("./index-data/{}.json", code))?;
    let reader = std::io::BufReader::new(file);
    let index_data = serde_json::from_reader(reader)?;
    Ok(index_data)
}

#[cfg(test)]
mod tests {
    mod get_index_code_list {
        #[test]
        fn test() {
            let index_code_list =
                crate::get_index_code_list().expect("get_index_code_list() error");
            assert_eq!(index_code_list.len(), 11);
            assert_eq!(index_code_list[0].code, "399975");
            assert_eq!(index_code_list[0].name, "证券公司");
        }
    }

    mod get_index_data_list_by_code {
        #[test]
        fn test() {
            let code = "000015";
            let index_data_list =
                crate::get_index_data_list_by_code(code).expect("get_index_data_by_code() error");
            assert_eq!(index_data_list.len(), 3484);
            assert_eq!(index_data_list[0].date, "2019-05-09");
            assert_eq!(index_data_list[0].close_point, 2686.36);
        }
    }
}
