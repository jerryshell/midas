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
            "/indexData/list/{code}",
            axum::routing::get(midas_http::controller::index_data::list_by_code),
        )
        .route(
            "/simulate",
            axum::routing::post(midas_http::controller::simulate::simulate),
        )
        .layer(cors);

    // init ip addr
    let ip_addr = std::env::var("IP_ADDR")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(std::net::IpAddr::V4(std::net::Ipv4Addr::new(0, 0, 0, 0)));

    // init port
    let port = std::env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(8000);
    tracing::info!("port {}", port);

    // init socket addr
    let socket_addr = std::net::SocketAddr::new(ip_addr, port);
    tracing::info!("socket_addr {}", socket_addr);

    // run app
    let app = app.into_make_service_with_connect_info::<std::net::SocketAddr>();
    let listener = tokio::net::TcpListener::bind(socket_addr)
        .await
        .expect("bind failed");
    axum::serve(listener, app).await.expect("serve failed");
}
