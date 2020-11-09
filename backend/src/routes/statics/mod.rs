use warp::Filter;
use warp::http::{Response, header};

#[cfg(not(feature="dotnotes_standalone"))]
mod statics_dev;
#[cfg(not(feature="dotnotes_standalone"))]
use statics_dev::get_routes;
#[cfg(not(feature="dotnotes_standalone"))]
static ENV: &str = " | Dev";

#[cfg(feature="dotnotes_standalone")]
mod statics_standalone;
#[cfg(feature="dotnotes_standalone")]
use statics_standalone::get_routes;
#[cfg(feature="dotnotes_standalone")]
static ENV: &str = "";

// Generates the HTML template used to load the Javascript bundle that is the app
// with bundle_name determining what bundle to load
pub fn generate_html(bundle_name: &str) -> String{
  return format!("<!DOCTYPE html>
<html>
  <head>
  <meta charset=\"utf-8\">
  <title>DotNotes{}</title>
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"></head>
  <body>
  <div id=\"body\"></div>
  <script src=\"/dist/{}\"></script>
  </body>
</html>", ENV, bundle_name)
}

pub fn get_static_routes() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
  let get_note_path = warp::path!("note" / String)
  .and(warp::get())
  .map(|_| {
      let resp_body: String = generate_html("note_editor_page-bundle.js").into();
      let mut resp = Response::new(resp_body);
      resp.headers_mut().insert(header::CONTENT_TYPE, header::HeaderValue::from_static("text/html"));
      resp
  });

let get_config_page_path = warp::path!("config")
  .and(warp::get())
  .map(|| {
      let resp_body: String = generate_html("note_editor_page-bundle.js").into();
      let mut resp = Response::new(resp_body);
      resp.headers_mut().insert(header::CONTENT_TYPE, header::HeaderValue::from_static("text/html"));
      resp
  });

  return get_note_path.or(get_config_page_path).or(get_routes());
}


