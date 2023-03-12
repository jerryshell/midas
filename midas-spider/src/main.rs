#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EastmoneyResponse {
    pub rc: i64,
    pub rt: i64,
    pub svr: i64,
    pub lt: i64,
    pub full: i64,
    pub dlmkts: String,
    pub data: EastmoneyResponseData,
}

#[derive(Default, Debug, Clone, PartialEq, serde_derive::Serialize, serde_derive::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EastmoneyResponseData {
    pub code: String,
    pub market: i64,
    pub name: String,
    pub decimal: i64,
    pub dktotal: i64,
    pub pre_k_price: f64,
    pub klines: Vec<String>,
}

async fn fetch_data(index_code: &midas_core::model::IndexCode, client: &reqwest::Client) {
    let url = format!("https://push2his.eastmoney.com/api/qt/stock/kline/get?secid={}&fields1=f1%2Cf2%2Cf3%2Cf4%2Cf5%2Cf6&fields2=f51%2Cf52%2Cf53%2Cf54%2Cf55%2Cf56%2Cf57%2Cf58%2Cf59%2Cf60%2Cf61&klt=101&fqt=1&beg=0&end=20500101&lmt=120", index_code.secid);

    let response = client.get(url).send().await.unwrap();

    let eastmoney_response = response.json::<EastmoneyResponse>().await.unwrap();

    let index_data_list = eastmoney_response
        .data
        .klines
        .iter()
        .map(|item| {
            let mut item_split = item.split(',');
            let date = item_split.next().unwrap();
            // let open_point = item_split.next().unwrap();
            let close_point = item_split.next().unwrap();
            // let high_point = item_split.next().unwrap();
            // let low_point = item_split.next().unwrap();
            // let volume = item_split.next().unwrap();
            // let amount = item_split.next().unwrap();
            // let amplitude = item_split.next().unwrap();
            // let chg_ratio = item_split.next().unwrap();
            // let chg = item_split.next().unwrap();
            // let turnover_rate = item_split.next().unwrap();

            midas_core::model::IndexData {
                date: date.to_string(),
                close_point: close_point.parse().unwrap(),
            }
        })
        .collect::<Vec<midas_core::model::IndexData>>();

    std::fs::write(
        format!("./index-data/{}.json", eastmoney_response.data.code),
        serde_json::to_string_pretty(&index_data_list).unwrap(),
    )
    .unwrap();
}

#[tokio::main]
async fn main() {
    let client = reqwest::Client::builder().build().unwrap();
    let index_code_list = midas_core::index_code::list().unwrap();
    for index_code in index_code_list {
        fetch_data(&index_code, &client).await
    }
}
