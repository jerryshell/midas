const DEFAULT_BIND_ADDR: &str = "0.0.0.0:8000";
const DEFAULT_STATIC_DIR: &str = "midas-web/dist";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // init tracing
    tracing_subscriber::fmt::init();

    // cors
    let cors = tower_http::cors::CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods(tower_http::cors::Any)
        .allow_headers(tower_http::cors::Any);

    // 生产环境由同一个进程托管前端静态文件；API 路由优先，其余回退到 index.html。
    let static_dir = std::env::var("STATIC_DIR").unwrap_or_else(|_| DEFAULT_STATIC_DIR.to_owned());
    let index_file = format!("{static_dir}/index.html");
    let static_service = tower_http::services::ServeDir::new(static_dir)
        .not_found_service(tower_http::services::ServeFile::new(index_file));

    // init route
    let app = axum::Router::new()
        .route("/health", axum::routing::get(|| async { "ok" }))
        .route(
            "/indexCode/list",
            axum::routing::get(midas_http::controller::index_code::list),
        )
        .route(
            "/indexData/list/{code}",
            axum::routing::get(midas_http::controller::index_data::list_by_code),
        )
        .route(
            "/simulate",
            axum::routing::post(midas_http::controller::simulate::simulate),
        )
        .route(
            "/signal",
            axum::routing::post(midas_http::controller::signal::signal),
        )
        .fallback_service(static_service)
        .layer(cors);

    let bind_addr = std::env::var("BIND_ADDR").unwrap_or(DEFAULT_BIND_ADDR.to_string());
    tracing::info!("bind_addr: {:?}", bind_addr);

    let tcp_listener = tokio::net::TcpListener::bind(&bind_addr).await?;

    // run app
    let app = app.into_make_service_with_connect_info::<std::net::SocketAddr>();
    axum::serve(tcp_listener, app).await?;

    Ok(())
}
