mod models;
mod schema;

use super::api::{Note, NoteLink};
pub use models::{DBNote, DBError, DBNoteLink, DBNoteLinkToInsert};
use chrono::prelude::*;
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager, Pool};
use rand::Rng;
use schema::{notes, note_links};

embed_migrations!();

sql_function!(fn upper(x: diesel::types::VarChar) -> diesel::types::VarChar);

/// DBConnection is a trait defining everything we need to be able to do with the database
/// Using this trait allows DB consumers to abstract their access and not worry about the
/// nature of the underlying data store
pub trait DBConnection {
    /// Run all the migrations created by the above `embed_migrations`
    fn run_migrations(&self) -> Result<(), diesel_migrations::RunMigrationsError>;

    /// Creates a new note, with default values, returning the ID for futher editing
    fn create_note(&self, name: String) -> Result<String, DBError>;

    /// Updates the given note in the DB (identified by the ID in the Note)
    /// to match the given note
    fn update_note(&self, note: &Note) -> Result<(), diesel::result::Error>;

    /// Gets the Note with the given ID
    fn get_note(&self, id: &str) -> Result<Option<DBNote>, diesel::result::Error>;

    /// Gets all the links pointing to a given note
    fn get_links_for_note(&self, id: &str) -> Result<Vec<DBNoteLink>, diesel::result::Error>;

    fn reconcile_note_links(&self, from_id: &str, links: Vec<NoteLink>) -> Result<(), diesel::result::Error>;

    fn search_notes(&self, query: String, limit: i64)
        -> Result<Vec<DBNote>, diesel::result::Error>;
}

pub struct SQLLiteDBConnection {
    pool: Pool<ConnectionManager<SqliteConnection>>,
}

impl SQLLiteDBConnection {
    pub fn new(path: &str) -> Result<SQLLiteDBConnection, r2d2::PoolError> {
        let manager = ConnectionManager::<SqliteConnection>::new(path);
        let pool = Pool::builder().max_size(1).build(manager)?;

        Ok(SQLLiteDBConnection { pool })
    }
}

impl DBConnection for SQLLiteDBConnection {
    fn run_migrations(&self) -> Result<(), diesel_migrations::RunMigrationsError> {
        let connection = self.pool.get().expect("Failed to get connection");
        match embedded_migrations::run(&connection) {
            Ok(()) => Ok(()),
            Err(e) => Err(e),
        }
    }

    fn create_note(&self, name: String) -> Result<String, DBError> {
        let connection = self.pool.get().expect("Failed to get connection");

        let existing_note = notes::table
            .filter(notes::title.eq(&name))
            .limit(1)
            .load::<DBNote>(&connection)
            .map(|res| res.into_iter().next())?;
        
        if existing_note.is_some() {
            // Reject request to create a note with a title that already exists
            return Err(DBError::AlreadyExists);
        }

        // Generate an ID for the new note, which is 32 random characters from the below ranges
        let mut rng = rand::thread_rng();
        let chars: Vec<char> = ('a'..'z').chain('A'..'Z').chain('0'..'9').collect();
        let new_id: String = (0..32)
            .map(|_| chars[rng.gen::<usize>() % chars.len()])
            .collect();

        // Get "Now" in UTC, which we use as the default edit and create date
        let now: i64 = Utc::now().timestamp();

        diesel::insert_into(notes::table)
            .values(DBNote {
                id: new_id.clone(),
                title: name,
                contents: "[\"\"]".to_owned(),
                daily: false,
                cdate: now,
                edate: now,
            })
            .execute(&connection)?;

        Ok(new_id)
    }

    fn update_note(&self, note: &Note) -> Result<(), diesel::result::Error> {
        let connection = self.pool.get().expect("Failed to get connection");
        let contents = serde_json::to_string(&note.contents).expect("Failed to marshall contents");
        diesel::update(notes::table)
            .filter(notes::id.eq(&note.id))
            .set((notes::title.eq(&note.title), notes::contents.eq(&contents)))
            .execute(&connection)?;
        Ok(())
    }

    // This commit takes a list of links from a given Note Page to others
    // and reconciles it with the DB, adding the missing and deleting the extraneous
    fn reconcile_note_links(&self, from_id: &str, links: Vec<NoteLink>) -> Result<(), diesel::result::Error>{
        let connection = self.pool.get().expect("Failed to get connection");
        // Get all the links from the given ID
        let current_links: Vec<DBNoteLink> = links.into_iter().map(|l| (from_id.to_owned(), l).into()).collect();
        let existing_links: Vec<DBNoteLink> = note_links::table
                                                .filter(note_links::from_id.eq(from_id))
                                                .load::<DBNoteLink>(&connection)?;
        let to_remove_ids: Vec<i32> = existing_links.iter().filter(|link| {
            current_links.iter().find(|l| { l.to_id == link.to_id && l.from_note_index == link.from_note_index}).is_none()
        }).map(|link| link.id).collect();

        let to_add: Vec<DBNoteLink> = current_links.into_iter().filter(|link| {
            existing_links.iter().find(|l| { l.to_id == link.to_id && l.from_note_index == link.from_note_index}).is_none()
        }).collect();

        diesel::delete(note_links::table).filter(note_links::id.eq_any(to_remove_ids)).execute(&connection)?;

        // SQLLite doesn't support multiple inserts, so we do them 1 by 1
        for link in to_add {
            let link: DBNoteLinkToInsert = link.into();
            diesel::insert_into(note_links::table).values(link).execute(&connection)?;
        }

        return Ok(());
    }

    fn get_note(&self, id: &str) -> QueryResult<Option<DBNote>> {
        let connection = self.pool.get().expect("Failed to get connection");
        notes::table
            .filter(notes::id.eq(id))
            .limit(1)
            .load::<DBNote>(&connection)
            .map(|res| res.into_iter().next())
    }

    fn get_links_for_note(&self, id: &str) -> Result<Vec<DBNoteLink>, diesel::result::Error> {
        let connection = self.pool.get().expect("Failed to get connection");
        note_links::table
            .filter(note_links::to_id.eq(id))
            .load::<DBNoteLink>(&connection)
    }

    fn search_notes(
        &self,
        query: String,
        limit: i64,
    ) -> Result<Vec<DBNote>, diesel::result::Error> {
        // This is really inefficient. It translates to WHERE UPPER(title) LIKE UPPER('%' :: $QUERY :: '%');
        // which sucks, but this is the only way I can think of to do partial word matches at the moment, outside
        // of an elasticsearch index which I'm not doing
        let connection = self.pool.get().expect("Failed to get connection");
        let query = format!("%{}%", query.to_uppercase());
        let db_query = notes::table
            .filter(upper(notes::title).like(query))
            .limit(limit);

        db_query.load::<DBNote>(&connection)
    }
}

impl Clone for SQLLiteDBConnection {
    fn clone(&self) -> SQLLiteDBConnection {
        SQLLiteDBConnection {
            pool: self.pool.clone(),
        }
    }
}
