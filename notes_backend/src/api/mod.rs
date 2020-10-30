mod models;

pub use models::{Note, NoteContents, NoteIDResult, APIError, NewNoteRequest, UpdateNoteRequest, NoteQueryArgs};

use crate::db::{DBConnection, SQLLiteDBConnection};
use std::convert::TryFrom;
use warp::Filter;
use warp::http::StatusCode;
use std::convert::TryInto;

pub fn get_api(
    db: SQLLiteDBConnection,
) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    let cors = warp::cors().allow_any_origin().allow_headers(vec!["content-type"]);

    // TODO: Make CORS less permissive
    let get_note_path = warp::path!("api" / "v1" / "note" / String)
        .and(warp::get())
        .and(with_db(db.clone()))
        .and_then(get_note).with(&cors.clone().allow_methods(vec!["PUT", "OPTIONS", "GET"]));
    
    let save_note_path = warp::path!("api" / "v1" / "note" / String)
        .and(warp::put())
        .and(warp::filters::body::json())
        .and(with_db(db.clone()))
        .and_then(save_note).with(&cors.clone().allow_methods(vec!["PUT", "OPTIONS", "GET"]));
    
    let create_note_path = warp::path!("api" / "v1" / "note")
        .and(warp::post())
        .and(warp::filters::body::json())
        .and(with_db(db.clone()))
        .and_then(create_note).with(cors.clone().allow_methods(vec!["POST", "OPTIONS", "GET"]));

    let search_note_path = warp::path!("api" / "v1" / "note")
        .and(warp::get())
        .and(warp::query::<NoteQueryArgs>())
        .and(with_db(db))
        .and_then(search_note).with(cors.allow_methods(vec!["POST", "OPTIONS", "GET"]));
    
    get_note_path.or(create_note_path).or(save_note_path).or(search_note_path)
}

fn with_db(
    db: SQLLiteDBConnection,
) -> impl Filter<Extract = (SQLLiteDBConnection,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || db.clone())
}

async fn create_note(req: NewNoteRequest, db: SQLLiteDBConnection) -> Result<impl warp::Reply, warp::Rejection> {
    match db.create_note(req.name) {
        Ok(id) => Ok(warp::reply::json(&NoteIDResult{id})),
        Err(e) => Err(warp::reject::custom(APIError::DatabaseError(e.to_string())))
    }
}

async fn get_note(
    id: String,
    db: SQLLiteDBConnection,
) -> Result<impl warp::Reply, warp::Rejection> {
    match db.get_note(&id) {
        Ok(Some(note)) => {
            let note = match Note::try_from(note) {
                Ok(note) => note,
                Err(_) => {
                    return Err(warp::reject::custom(APIError::MalformedData));
                }
            };
            Ok(Box::new(warp::reply::json(&note)))
        }
        Ok(None) => Err(warp::reject::not_found()),
        Err(e) => Err(warp::reject::custom(APIError::DatabaseError(e.to_string())))
    }
}

async fn save_note(id: String, note: UpdateNoteRequest, db: SQLLiteDBConnection) -> Result<impl warp::Reply, warp::Rejection> {
    match db.update_note(&Note{id: id, title: note.title, contents: note.contents}) {
        Ok(()) => Ok(StatusCode::NO_CONTENT),
        Err(e) => Err(warp::reject::custom(APIError::DatabaseError(e.to_string())))
    }
}

async fn search_note(params: NoteQueryArgs, db: SQLLiteDBConnection) -> Result<impl warp::Reply, warp::Rejection> {
    match db.search_notes(params.query, params.limit as i64) {
        Ok(res) => {
            let notes: Vec<Note> = res.into_iter().map(|note| note.try_into().unwrap()).collect();
            Ok(warp::reply::json(&notes))
        },
        Err(e) => Err(warp::reject::custom(APIError::DatabaseError(e.to_string())))
    }
}