use super::schema::notes;

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

pub enum DBError {
    DBError(diesel::result::Error),
    AlreadyExists
}

impl From<diesel::result::Error> for DBError {
    fn from(e: diesel::result::Error) -> DBError {
        DBError::DBError(e)
    }
}