use serde::{Serialize, Deserialize};
use warp::Filter;

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
enum NoteContents {
    Note(String),
    Block(Vec<NoteContents>)
}

#[derive(Serialize, Deserialize, Debug)]
struct Note {
    title: String,
    contents: Vec<NoteContents>
}

pub fn get_api() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    // TODO: Make CORS less permissive
    return warp::path!("api" / "v1" / "note" / String).and(warp::get()).and_then(get_note).with(warp::cors().allow_any_origin().allow_methods(vec!["OPTIONS", "GET", "POST", "DELETE", "PUT"]));
}

async fn get_note(guid: String) -> Result<impl warp::Reply, warp::Rejection> {
    match guid.as_str() {
        "1" => {
            Ok(Box::new(warp::reply::json(&Note{
                title: "Test Note 1".to_owned(),
                contents: vec![
                    NoteContents::Note("Cats".to_owned()),
                    NoteContents::Note("Dogs".to_owned()),
                    NoteContents::Block(vec![
                        NoteContents::Note("More Cats".to_owned()),
                        NoteContents::Block(vec![
                            NoteContents::Note("More Dogs".to_owned()),
                        ]),
                        NoteContents::Note("Pigs".to_owned()),
                    ]),
                    NoteContents::Note("More Pigs".to_owned()),
                ]
            })))
        },
        _ => {
            Err(warp::reject::not_found())
        }
    }
}
