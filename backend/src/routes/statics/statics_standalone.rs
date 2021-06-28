use warp::http::header;
use warp::reply::Response;
use warp::Filter;

static EDITOR_BUNDLE: &[u8] = include_bytes!("../../../bundles/note_editor_page-bundle.js");
static FRONT_PAGE_BUNDLE: &[u8] = include_bytes!("../../../bundles/main_page-bundle.js");
static CONFIG_PAGE_BUNDLE: &[u8] = include_bytes!("../../../bundles/config_page-bundle.js");


// In Prod mode, we bundle the frontend into the binary (using the `include_bytes` above)
// so we need to manually specify each "file"
pub fn get_routes() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    let get_editor_bundle_path = warp::path!("dist" / "note_editor_page-bundle.js")
        .and(warp::get())
        .map(|| {
            let mut resp = Response::new(EDITOR_BUNDLE.into());
            resp.headers_mut().insert(
                header::CONTENT_TYPE,
                header::HeaderValue::from_static("application/javascript"),
            );
            resp
        });

    let get_front_page_bundle_path = warp::path!("dist" / "main_page-bundle.js")
        .and(warp::get())
        .map(|| {
            let mut resp = Response::new(FRONT_PAGE_BUNDLE.into());
            resp.headers_mut().insert(
                header::CONTENT_TYPE,
                header::HeaderValue::from_static("application/javascript"),
            );
            resp
        });

    let get_config_page_bundle_path = warp::path!("dist" / "config_page-bundle.js")
        .and(warp::get())
        .map(|| {
            let mut resp = Response::new(CONFIG_PAGE_BUNDLE.into());
            resp.headers_mut().insert(
                header::CONTENT_TYPE,
                header::HeaderValue::from_static("application/javascript"),
            );
            resp
        });

    return get_editor_bundle_path
        .or(get_front_page_bundle_path)
        .or(get_config_page_bundle_path)
        .with(warp::log("standalone"));
}
