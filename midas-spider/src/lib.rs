use rayon::prelude::*;

#[derive(serde::Deserialize)]
struct EastmoneyResponse {
    // pub rc: i64,
    // pub rt: i64,
    // pub svr: i64,
    // pub lt: i64,
    // pub full: i64,
    // pub dlmkts: String,
    pub data: EastmoneyResponseData,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct EastmoneyResponseData {
    pub code: String,
    // pub market: i64,
    // pub name: String,
    // pub decimal: i64,
    // pub dktotal: i64,
    // pub pre_k_price: f64,
    pub klines: Vec<String>,
}

pub async fn fetch_data(index_code: &midas_core::model::IndexCode, client: &reqwest::Client) {
    tracing::info!("fetch {} date -> begin", index_code.code);

    let url = format!("https://push2his.eastmoney.com/api/qt/stock/kline/get?secid={}&fields1=f1%2Cf2%2Cf3%2Cf4%2Cf5%2Cf6&fields2=f51%2Cf52%2Cf53%2Cf54%2Cf55%2Cf56%2Cf57%2Cf58%2Cf59%2Cf60%2Cf61&klt=101&fqt=1&beg=0&end=20500101&lmt=120", index_code.secid);

    let response = client.get(url).send().await.unwrap();

    let eastmoney_response = response.json::<EastmoneyResponse>().await.unwrap();

    let index_data_list = eastmoney_response
        .data
        .klines
        .par_iter()
        .map(|item| {
            let item_split_vec = item.split(',').collect::<Vec<&str>>();
            let date = item_split_vec[0];
            // let open_point = item_split_vec[1];
            let close_point = item_split_vec[2];
            // let high_point = item_split_vec[3];
            // let low_point = item_split_vec[4];
            // let volume = item_split_vec[5];
            // let amount = item_split_vec[6];
            // let amplitude = item_split_vec[7];
            // let chg_ratio = item_split_vec[8];
            // let chg = item_split_vec[9];
            // let turnover_rate = item_split_vec[10];

            midas_core::model::IndexData {
                date: date.to_string(),
                close_point: close_point.parse().unwrap(),
            }
        })
        .collect::<Vec<midas_core::model::IndexData>>();

    std::fs::write(
        format!("index-data/{}.json", eastmoney_response.data.code),
        serde_json::to_string_pretty(&index_data_list).unwrap(),
    )
    .unwrap();

    tracing::info!("fetch {} date <- end", index_code.code);
}
