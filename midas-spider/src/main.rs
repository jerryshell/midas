#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // init tracing
    tracing_subscriber::fmt::init();

    // init client
    let client = reqwest::Client::builder().build()?;

    let index_code_list = midas_core::index_code::list()?;

    let fetch_data_future_iter = index_code_list
        .iter()
        .map(|index_code| midas_spider::fetch_data(index_code, &client));

    let results = futures::future::join_all(fetch_data_future_iter).await;
    for result in results {
        if let Err(e) = result {
            tracing::error!("fetch data failed: {}", e);
        }
    }

    Ok(())
}
