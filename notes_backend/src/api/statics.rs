use warp::Filter;
use warp::reply::Response;
use warp::http::header;

fn generate_html(bundle_name: &str) -> String{
    return format!("<!DOCTYPE html>
<html>
    <head>
    <meta charset=\"utf-8\">
    <title>Webpack Output</title>
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head>
    <body>
    <div id=\"body\"></div>
    <script src=\"/dist/{}\"></script>
    </body>
</html>", bundle_name)
}

static BUNDLE: &[u8] = include_bytes!("../../bundles/note_editor_page-bundle.js");

pub fn get_static_routes() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    let get_bundle_path = warp::path!("dist" / "note_editor_page-bundle.js")
        .and(warp::get())
        .map(|| {
            let mut resp = Response::new(BUNDLE.into());
            resp.headers_mut().insert(header::CONTENT_TYPE, header::HeaderValue::from_static("application/javascript"));
            resp
        });

    let get_note_path = warp::path!("note" / String)
        .and(warp::get())
        .map(|_id| {
            let mut resp = Response::new(generate_html("note_editor_page-bundle.js").into());
            resp.headers_mut().insert(header::CONTENT_TYPE, header::HeaderValue::from_static("text/html"));
            resp
        });

    return get_bundle_path.or(get_note_path);
}