use super::schema::{note_links, notes, schedule};
use crate::routes::api::NoteLink;

// DBNote represents a Note that can be loaded and inserted into
// the database.
#[derive(Insertable, Queryable)]
#[table_name = "notes"]
pub struct DBNote {
    // The Unique ID of the note
    pub id: String,

    // The title of the note
    pub title: String,

    // The JSON encoded nested list representing the note
    pub contents: String,

    // Whether this note was created as a "daily" note or not
    pub daily: bool,

    // The time that this note was created
    pub cdate: i64,

    // The time that this note was last edited
    pub edate: i64,
}

// DBNote represents a Note that can be loaded and inserted into
// the database.
#[derive(Queryable)]
pub struct DBNoteLink {
    pub id: i32,
    pub from_id: String,
    pub to_id: String,
    pub from_note_index: String,
}

// DBNote represents a Note that can be loaded and inserted into
// the database.
#[derive(Insertable)]
#[table_name = "note_links"]
pub struct DBNoteLinkToInsert {
    pub from_id: String,
    pub to_id: String,
    pub from_note_index: String,
}

impl From<DBNoteLink> for DBNoteLinkToInsert {
    fn from(link: DBNoteLink) -> DBNoteLinkToInsert {
        DBNoteLinkToInsert {
            from_id: link.from_id,
            to_id: link.to_id,
            from_note_index: link.from_note_index,
        }
    }
}

impl From<(String, NoteLink)> for DBNoteLink {
    fn from(dat: (String, NoteLink)) -> DBNoteLink {
        let (from_id, link) = dat;

        return DBNoteLink {
            id: -1,
            from_id,
            to_id: link.to_id,
            from_note_index: serde_json::to_string(&link.from_note_index).unwrap(),
        };
    }
}

#[derive(Insertable)]
#[table_name = "schedule"]
pub struct DBScheduleToInsert {
    pub title: String,
    pub name_template: String,
    pub schedule_cron: String,
    pub enabled: bool
}

#[derive(Queryable)]
pub struct DBSchedule {
    pub id: i32,
    pub title: String,
    pub name_template: String,
    pub schedule_cron: String,
    pub enabled: bool
}

#[derive(Debug)]
pub enum DBError {
    DBError(diesel::result::Error),
    AlreadyExists,
    InvalidData
}

impl From<diesel::result::Error> for DBError {
    fn from(e: diesel::result::Error) -> DBError {
        DBError::DBError(e)
    }
}
