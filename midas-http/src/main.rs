#[tokio::main]
async fn main() {
    // init tracing
    tracing_subscriber::fmt::init();

    // cors
    let cors = tower_http::cors::CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods(tower_http::cors::Any)
        .allow_headers(tower_http::cors::Any);

    // init route
    let app = axum::Router::new()
        .route(
            "/indexCode/list",
            axum::routing::get(midas_http::controller::index_code::list),
        )
        .route(
            "/indexData/list/:code",
            axum::routing::get(midas_http::controller::index_data::list_by_code),
        )
        .route(
            "/simulate/:code",
            axum::routing::get(midas_http::controller::simulate::simulate),
        )
        .layer(cors);

    // init port
    let port = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8000);
    tracing::info!(port);

    // run app
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("addr={}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service_with_connect_info::<std::net::SocketAddr>())
        .await
        .expect("axum::Server::bind().serve() err");
}
