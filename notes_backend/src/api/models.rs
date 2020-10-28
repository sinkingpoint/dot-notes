use serde::{Deserialize, Serialize};
use std::convert::TryFrom;
use warp::reject::Reject;

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum NoteContents {
    Note(String),
    Block(Vec<NoteContents>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub contents: Vec<NoteContents>,
}

#[derive(Serialize, Debug)]
pub struct NoteIDResult {
    pub id: String,
}

#[derive(Deserialize, Debug)]
pub struct NewNoteRequest {
    pub name: String
}

#[derive(Deserialize, Debug)]
pub struct UpdateNoteRequest {
    pub title: String,
    pub contents: Vec<NoteContents>,
}

#[derive(Debug)]
pub enum APIError {
    DatabaseError(String),
    MalformedData,
}

impl Reject for APIError {}

impl TryFrom<crate::db::DBNote> for Note {
    type Error = APIError;

    fn try_from(n: crate::db::DBNote) -> Result<Note, Self::Error> {
        let contents = match serde_json::from_str(&n.contents) {
            Ok(note_contents) => note_contents,
            Err(_) => {
                return Err(APIError::MalformedData);
            }
        };

        Ok(Note {
            id: n.id,
            title: n.title,
            contents,
        })
    }
}
