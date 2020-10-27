use serde::{Serialize, Deserialize};
use std::convert::TryFrom;

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum NoteContents {
    Note(String),
    Block(Vec<NoteContents>)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Note {
    pub id: Option<String>,
    pub title: String,
    pub contents: Vec<NoteContents>
}

pub enum APIError {
    DataFormatError
}

impl TryFrom<crate::db::DBNote> for Note {
    type Error = APIError;

    fn try_from(n: crate::db::DBNote) -> Result<Note, Self::Error>{
        let contents = match serde_json::from_str(&n.contents) {
            Ok(note_contents) => note_contents,
            Err(_) => {
                return Err(APIError::DataFormatError);
            }
        };

        return Ok(Note {
            id: Some(n.id),
            title: n.title,
            contents: contents,
        });
    }
}
