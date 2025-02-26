use crate::*;

pub fn list() -> Result<Vec<model::IndexCode>, Box<dyn std::error::Error>> {
    let file = std::fs::File::open("index-data/codes.json")?;
    let reader = std::io::BufReader::new(file);
    let index_code_list = serde_json::from_reader::<_, Vec<model::IndexCode>>(reader)?;
    Ok(index_code_list)
}

#[cfg(test)]
mod tests {
    use crate::*;

    #[test]
    fn test_list() {
        let index_code_list = index_code::list().unwrap();
        assert_eq!(index_code_list.len(), 8);
    }
}
