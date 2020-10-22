mod api;

#[tokio::main]
async fn main() {
    let routes = api::get_api();

    warp::serve(routes)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
