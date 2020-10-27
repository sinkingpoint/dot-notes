mod models;

pub use models::{Note, NoteContents};

use warp::Filter;
use crate::db::{SQLLiteDBConnection, DBConnection};
use std::convert::TryFrom;

pub fn get_api(db: SQLLiteDBConnection) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    // TODO: Make CORS less permissive
    return warp::path!("api" / "v1" / "note" / String).and(warp::get()).and(with_db(db)).and_then(get_note).with(warp::cors().allow_any_origin().allow_methods(vec!["OPTIONS", "GET", "POST", "DELETE", "PUT"]));
}

fn with_db(db: SQLLiteDBConnection) -> impl Filter<Extract = (SQLLiteDBConnection,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || db.clone())
}

async fn get_note(id: String, db: SQLLiteDBConnection) -> Result<impl warp::Reply, warp::Rejection> {
    match db.get_note(&id) {
        Ok(Some(note)) => {
            let note = match Note::try_from(note) {
                Ok(note) => note,
                Err(_) => {
                    return Err(warp::reject::reject());
                }
            };
            Ok(Box::new(warp::reply::json(&note)))
        },
        Ok(None) => Err(warp::reject::not_found()),
        Err(e) => {
            eprintln!("Failed to get note: {}", e);
            Err(warp::reject::not_found())
        }
    }
}
