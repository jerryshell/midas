#[derive(serde::Deserialize)]
struct EastmoneyResponse {
    data: EastmoneyResponseData,
}

#[derive(serde::Deserialize)]
struct EastmoneyResponseData {
    klines: Vec<String>,
}

pub async fn fetch_data(
    index_code: &midas_core::model::IndexCode,
    client: &reqwest::Client,
) -> Result<(), Box<dyn std::error::Error>> {
    tracing::info!("fetch {} date -> begin", index_code.code);

    match fetch_eastmoney(index_code, client).await {
        Ok(index_data_list) => {
            save_merged(index_code, index_data_list)?;
            tracing::info!("fetch {} date <- end (eastmoney)", index_code.code);
            Ok(())
        }
        Err(eastmoney_error) => {
            tracing::warn!(
                "eastmoney failed for {}: {}; falling back to tencent",
                index_code.code,
                eastmoney_error
            );
            let index_data_list = fetch_tencent(index_code, client).await?;
            save_merged(index_code, index_data_list)?;
            tracing::info!("fetch {} date <- end (tencent)", index_code.code);
            Ok(())
        }
    }
}

async fn fetch_eastmoney(
    index_code: &midas_core::model::IndexCode,
    client: &reqwest::Client,
) -> Result<Vec<midas_core::model::IndexData>, Box<dyn std::error::Error>> {
    let url = format!(
        "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid={}&fields1=f1%2Cf2%2Cf3%2Cf4%2Cf5%2Cf6&fields2=f51%2Cf52%2Cf53%2Cf54%2Cf55%2Cf56%2Cf57%2Cf58%2Cf59%2Cf60%2Cf61&klt=101&fqt=1&beg=0&end=20500101&lmt=120",
        index_code.secid
    );

    let response = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0")
        .send()
        .await?
        .error_for_status()?;

    let eastmoney_response = response.json::<EastmoneyResponse>().await?;

    let mut index_data_list = Vec::with_capacity(eastmoney_response.data.klines.len());
    for item in &eastmoney_response.data.klines {
        let item_split_vec = item.split(',').collect::<Vec<&str>>();
        let date = item_split_vec
            .first()
            .ok_or("missing date in eastmoney kline")?;
        let close_point = item_split_vec
            .get(2)
            .ok_or("missing close in eastmoney kline")?
            .parse::<f64>()?;
        index_data_list.push(midas_core::model::IndexData {
            date: date.to_string(),
            close_point,
        });
    }

    Ok(index_data_list)
}

async fn fetch_tencent(
    index_code: &midas_core::model::IndexCode,
    client: &reqwest::Client,
) -> Result<Vec<midas_core::model::IndexData>, Box<dyn std::error::Error>> {
    let prefix = if index_code.secid.starts_with("1.") {
        "sh"
    } else {
        "sz"
    };
    let symbol = format!("{prefix}{}", index_code.code);
    // 腾讯接口单次最多返回约 320 根日线；与本地历史合并后即可增量更新。
    let url =
        format!("https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={symbol},day,,,320,qfq");

    let response = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0")
        .send()
        .await?
        .error_for_status()?;
    let value: serde_json::Value = response.json().await?;
    let rows = value["data"][&symbol]["day"]
        .as_array()
        .ok_or("tencent response missing day array")?;

    let mut index_data_list = Vec::with_capacity(rows.len());
    for row in rows {
        let fields = row.as_array().ok_or("tencent row is not an array")?;
        let date = fields
            .first()
            .and_then(|v| v.as_str())
            .ok_or("tencent row missing date")?;
        let close_point = fields
            .get(2)
            .and_then(|v| v.as_str())
            .ok_or("tencent row missing close")?
            .parse::<f64>()?;
        index_data_list.push(midas_core::model::IndexData {
            date: date.to_string(),
            close_point,
        });
    }

    Ok(index_data_list)
}

fn save_merged(
    index_code: &midas_core::model::IndexCode,
    incoming: Vec<midas_core::model::IndexData>,
) -> Result<(), Box<dyn std::error::Error>> {
    let path = format!("index-data/{}.json", index_code.code);
    let mut by_date = std::collections::BTreeMap::<String, f64>::new();

    if let Ok(existing) = std::fs::read_to_string(&path)
        .ok()
        .and_then(|content| {
            serde_json::from_str::<Vec<midas_core::model::IndexData>>(&content).ok()
        })
        .ok_or(())
    {
        for item in existing {
            by_date.insert(item.date, item.close_point);
        }
    }

    for item in incoming {
        by_date.insert(item.date, item.close_point);
    }

    let merged = by_date
        .into_iter()
        .map(|(date, close_point)| midas_core::model::IndexData { date, close_point })
        .collect::<Vec<_>>();

    std::fs::write(&path, serde_json::to_string_pretty(&merged)?)?;
    tracing::info!("saved {} rows to {}", merged.len(), path);
    Ok(())
}
