pub fn list() -> Result<Vec<crate::model::IndexCode>, Box<dyn std::error::Error>> {
    let file = std::fs::File::open("index-data/codes.json")?;
    let reader = std::io::BufReader::new(file);
    let index_code_list = serde_json::from_reader::<_, Vec<crate::model::IndexCode>>(reader)?;
    Ok(index_code_list)
}

#[cfg(test)]
mod tests {
    mod list {
        #[test]
        fn test() {
            let index_code_list = crate::index_code::list().expect("get_index_code_list() error");
            assert_eq!(index_code_list.len(), 8);
        }
    }
}
