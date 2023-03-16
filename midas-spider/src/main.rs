#[tokio::main]
async fn main() {
    // init tracing
    tracing_subscriber::fmt::init();

    // init client
    let client = reqwest::Client::builder().build().unwrap();

    let index_code_list = midas_core::index_code::list().unwrap();

    let fetch_data_future_iter = index_code_list
        .iter()
        .map(|index_code| midas_spider::fetch_data(index_code, &client));

    futures::future::join_all(fetch_data_future_iter).await;
}
