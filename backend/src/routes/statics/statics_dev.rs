use warp::Filter;

// In dev mode, we don't bundle the static files into the app, we just serve them
// from the dist directory
pub fn get_routes() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("dist").and(warp::fs::dir("frontend/dist"))
}
