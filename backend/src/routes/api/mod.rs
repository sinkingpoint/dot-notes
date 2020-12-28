mod models;

pub use models::{
    APIError, APIErrorResponse, GetNoteLinksResponse, GetRecentNotesQuery, NewNoteRequest, Note,
    NoteContents, NoteIDResult, NoteLink, NoteQueryArgs, UpdateNoteRequest,
};

use crate::db::{DBConnection, SQLLiteDBConnection};
use regex::Regex;
use std::convert::TryFrom;
use std::convert::TryInto;
use warp::http::{header, Method, StatusCode};
use warp::Filter;

pub fn get_api(
    db: SQLLiteDBConnection,
) -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    // TODO: Make CORS less permissive
    let get_note_path = warp::path!("note" / String)
        .and(warp::get())
        .and(with_db(db.clone()))
        .and_then(get_note);

    let save_note_path = warp::path!("note" / String)
        .and(warp::put())
        .and(warp::filters::body::json())
        .and(with_db(db.clone()))
        .and_then(save_note);

    let create_note_path = warp::path!("note")
        .and(warp::post())
        .and(warp::filters::body::json())
        .and(with_db(db.clone()))
        .and_then(create_note);

    let search_note_path = warp::path!("note")
        .and(warp::get())
        .and(warp::query::<NoteQueryArgs>())
        .and(with_db(db.clone()))
        .and_then(search_note);

    let get_links_path = warp::path!("note" / String / "links")
        .and(warp::get())
        .and(with_db(db.clone()))
        .and_then(get_links_to_note);

    let get_recent_notes_path = warp::path!("note" / "recent")
        .and(warp::get())
        .and(warp::query::<GetRecentNotesQuery>())
        .and(with_db(db))
        .and_then(get_recent_notes);

    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(&[
            Method::GET,
            Method::PUT,
            Method::POST,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(vec![header::CONTENT_TYPE, header::AUTHORIZATION])
        .build();

    let paths = warp::path!("api" / "v1" / ..).and(
        get_note_path
            .or(create_note_path)
            .or(save_note_path)
            .or(search_note_path)
            .or(get_links_path)
            .or(get_recent_notes_path),
    );
    paths.with(cors)
}

fn with_db(
    db: SQLLiteDBConnection,
) -> impl Filter<Extract = (SQLLiteDBConnection,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || db.clone())
}

async fn create_note(
    req: NewNoteRequest,
    db: SQLLiteDBConnection,
) -> Result<impl warp::Reply, warp::Rejection> {
    match db.create_note(req.name) {
        Ok(id) => Ok(warp::reply::json(&NoteIDResult { id })),
        Err(e) => {
            let api_error: APIError = e.into();
            Err(warp::reject::custom(api_error))
        }
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
        Ok(None) => Err(warp::reject::custom(APIError::NotFound)),
        Err(e) => Err(warp::reject::custom(APIError::DatabaseError(e.to_string()))),
    }
}

fn find_note_links(note_id: &str, note_data: &Vec<NoteContents>) -> Vec<NoteLink> {
    let re = Regex::new(r"\[\[([a-zA-Z0-9]{32})\]\]").unwrap();
    let mut links = Vec::new();
    for (i, note) in note_data.iter().enumerate() {
        match note {
            NoteContents::Block(new_data) => {
                links.append(
                    &mut find_note_links(note_id.clone(), new_data)
                        .into_iter()
                        .map(|mut link| {
                            link.from_note_index.push(i);
                            return link;
                        })
                        .collect(),
                );
            }
            NoteContents::Note(data) => {
                for link in re.captures_iter(data) {
                    links.push(NoteLink {
                        to_id: link[1].to_owned(),
                        from_note_index: vec![i],
                    });
                }
            }
        }
    }

    // Indices are added in reverse order (Last first as we go back up the tree)
    // So here we reverse it back
    links
        .into_iter()
        .map(|mut link| {
            link.from_note_index.reverse();
            return link;
        })
        .collect()
}

// TODO: Make this able to save one note list chunk at a time, rather than the whole thing
async fn save_note(
    id: String,
    note: UpdateNoteRequest,
    db: SQLLiteDBConnection,
) -> Result<impl warp::Reply, warp::Rejection> {
    match db.update_note(&Note {
        id: id.clone(),
        title: note.title,
        contents: note.contents.clone(),
    }) {
        Ok(()) => {}
        Err(e) => {
            return Err(warp::reject::custom(APIError::DatabaseError(e.to_string())));
        }
    }

    let links = find_note_links(&id, &note.contents);

    match db.reconcile_note_links(&id, links) {
        Ok(()) => {}
        Err(e) => {
            return Err(warp::reject::custom(APIError::DatabaseError(e.to_string())));
        }
    }

    return Ok(StatusCode::NO_CONTENT);
}

async fn search_note(
    params: NoteQueryArgs,
    db: SQLLiteDBConnection,
) -> Result<impl warp::Reply, warp::Rejection> {
    match db.search_notes(params.query, params.limit as i64) {
        Ok(res) => {
            let notes: Vec<Note> = res
                .into_iter()
                .map(|note| note.try_into().unwrap())
                .collect();
            Ok(warp::reply::json(&notes))
        }
        Err(e) => Err(warp::reject::custom(APIError::DatabaseError(e.to_string()))),
    }
}

async fn get_links_to_note(
    id: String,
    db: SQLLiteDBConnection,
) -> Result<impl warp::Reply, warp::Rejection> {
    match db.get_links_for_note(&id) {
        Ok(links) => {
            let links: Vec<NoteLink> = links
                .into_iter()
                .map(|link| link.try_into().unwrap())
                .collect();

            Ok(warp::reply::json(&GetNoteLinksResponse { links: links }))
        }
        Err(e) => Err(warp::reject::custom(APIError::DatabaseError(e.to_string()))),
    }
}

async fn get_recent_notes(
    params: GetRecentNotesQuery,
    db: SQLLiteDBConnection,
) -> Result<impl warp::Reply, warp::Rejection> {
    match db.get_recent_notes(params.offset, params.limit) {
        Ok(res) => {
            let notes: Vec<Note> = res
                .into_iter()
                .map(|note| note.try_into().unwrap())
                .collect();
            Ok(warp::reply::json(&notes))
        }
        Err(e) => Err(warp::reject::custom(APIError::DatabaseError(e.to_string()))),
    }
}
