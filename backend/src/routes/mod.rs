use std::convert::Infallible;

use warp::{Filter, hyper::StatusCode};

use crate::db::SQLLiteDBConnection;

use self::api::{APIError, APIErrorResponse};

mod statics;
pub mod api;

pub async fn handle_rejection(err: warp::Rejection) -> Result<impl warp::Reply, Infallible> {
  let msg: &str;
  let code: StatusCode;
  if err.is_not_found() {
    code = StatusCode::NOT_FOUND;
    msg = "Not Found";
  }
  else if let Some(e) = err.find::<APIError>() {
      let (msg2, code2) = match e {
          APIError::DatabaseError(_) => ("Database Error", StatusCode::INTERNAL_SERVER_ERROR),
          APIError::MalformedData => ("Malformed Data", StatusCode::INTERNAL_SERVER_ERROR),
          APIError::NotFound => ("Not Found", StatusCode::NOT_FOUND),
          APIError::AlreadyExists => ("Already Exists", StatusCode::CONFLICT)
      };

      msg = msg2;
      code = code2;
  } else if let Some(_) = err.find::<warp::reject::InvalidQuery>() {
      code = StatusCode::BAD_REQUEST;
      msg = "Invalid Query";
  } else if let Some(_) = err.find::<warp::reject::MethodNotAllowed>() {
      code = StatusCode::METHOD_NOT_ALLOWED;
      msg = "Method Not Allowed";
  } else {
      code = StatusCode::BAD_REQUEST;
      msg = "Unexpected Error";
  }

  let json = warp::reply::json(&APIErrorResponse { message: msg });

  Ok(warp::reply::with_status(json, code))
}

pub fn get_routes(db: SQLLiteDBConnection) -> impl Filter<Extract = impl warp::Reply, Error = Infallible> + Clone {
  statics::get_static_routes().or(api::get_api(db)).recover(handle_rejection)
}