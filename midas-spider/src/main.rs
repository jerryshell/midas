#[tokio::main]
async fn main() {
    // init tracing
    tracing_subscriber::fmt::init();

    // init client
    let client = reqwest::Client::builder().build().unwrap();

    let index_code_list = midas_core::index_code::list().unwrap();
    for index_code in index_code_list {
        midas_spider::fetch_data(&index_code, &client).await
    }
}
