mod models;
mod schema;

use crate::schedule::is_valid_cron;

use super::routes::api::{Note, NoteLink};
use chrono::prelude::*;
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager, Pool};
pub use models::*;
use rand::Rng;
use schema::{note_links, notes, schedule};

embed_migrations!();

no_arg_sql_function!(
    last_insert_rowid,
    diesel::sql_types::Integer,
    "Represents the SQL last_insert_row() function"
);

sql_function!(fn upper(x: diesel::types::VarChar) -> diesel::types::VarChar);

/// DBConnection is a trait defining everything we need to be able to do with the database
/// Using this trait allows DB consumers to abstract their access and not worry about the
/// nature of the underlying data store
pub trait DBConnection {
    /// Run all the migrations created by the above `embed_migrations`
    fn run_migrations(&self) -> Result<(), diesel_migrations::RunMigrationsError>;

    /// Creates a new note, with default values, returning the ID for futher editing
    fn create_note(&self, name: &str) -> Result<String, DBError>;

    /// Updates the given note in the DB (identified by the ID in the Note)
    /// to match the given note
    fn update_note(&self, note: &Note) -> Result<(), diesel::result::Error>;

    /// Gets the Note with the given ID
    fn get_note(&self, id: &str) -> Result<Option<DBNote>, diesel::result::Error>;

    /// Gets all the links pointing to a given note
    fn get_links_for_note(&self, id: &str) -> Result<Vec<DBNoteLink>, diesel::result::Error>;

    /// Creates a new schedule, with the given title. Returns an error if schedule_cron isn't a valid cron expression
    fn create_schedule<T: Into<DBScheduleToInsert>>(&self, to_insert: T) -> Result<i32, DBError>;

    /// Gets a Vec containing all the schedules. TODO: Paginate this
    fn get_all_schedules(&self) -> Result<Vec<DBSchedule>, DBError>;

    /// Updates the given schedule in the DB (identified by the ID in the Schedule)
    /// to match the given schedule
    fn update_schedule<T: Into<DBSchedule>>(&self, schedule: T) -> Result<(), DBError>;

    fn reconcile_note_links(
        &self,
        from_id: &str,
        links: Vec<NoteLink>,
    ) -> Result<(), diesel::result::Error>;

    fn search_notes(&self, query: String, limit: i64)
        -> Result<Vec<DBNote>, diesel::result::Error>;

    fn get_recent_notes(
        &self,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<DBNote>, diesel::result::Error>;
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

    fn create_note(&self, name: &str) -> Result<String, DBError> {
        let connection = self.pool.get().expect("Failed to get connection");

        let existing_note = notes::table
            .filter(notes::title.eq(name))
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
                title: name.to_owned(),
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
    fn reconcile_note_links(
        &self,
        from_id: &str,
        links: Vec<NoteLink>,
    ) -> Result<(), diesel::result::Error> {
        let connection = self.pool.get().expect("Failed to get connection");
        // Get all the links from the given ID
        let current_links: Vec<DBNoteLink> = links
            .into_iter()
            .map(|l| (from_id.to_owned(), l).into())
            .collect();
        let existing_links: Vec<DBNoteLink> = note_links::table
            .filter(note_links::from_id.eq(from_id))
            .load::<DBNoteLink>(&connection)?;
        let to_remove_ids: Vec<i32> = existing_links
            .iter()
            .filter(|link| {
                current_links
                    .iter()
                    .find(|l| l.to_id == link.to_id && l.from_note_index == link.from_note_index)
                    .is_none()
            })
            .map(|link| link.id)
            .collect();

        let to_add: Vec<DBNoteLink> = current_links
            .into_iter()
            .filter(|link| {
                existing_links
                    .iter()
                    .find(|l| l.to_id == link.to_id && l.from_note_index == link.from_note_index)
                    .is_none()
            })
            .collect();

        diesel::delete(note_links::table)
            .filter(note_links::id.eq_any(to_remove_ids))
            .execute(&connection)?;

        // SQLLite doesn't support multiple inserts, so we do them 1 by 1
        for link in to_add {
            let link: DBNoteLinkToInsert = link.into();
            diesel::insert_into(note_links::table)
                .values(link)
                .execute(&connection)?;
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

    fn get_recent_notes(
        &self,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<DBNote>, diesel::result::Error> {
        let connection = self.pool.get().expect("Failed to get connection");
        let db_query = notes::table
            .order_by(notes::edate)
            .offset(offset)
            .limit(limit);

        db_query.load::<DBNote>(&connection)
    }

    /// Creates a new schedule, with the given title. Returns an error if schedule_cron isn't a valid cron expression
    fn create_schedule<T: Into<DBScheduleToInsert>>(&self, to_insert: T) -> Result<i32, DBError> {
        let connection = self.pool.get().expect("Failed to get connection");
        let to_insert: DBScheduleToInsert = to_insert.into();

        if !is_valid_cron(&to_insert.schedule_cron) {
            return Err(DBError::InvalidData);
        }

        diesel::insert_into(schedule::table)
            .values(to_insert)
            .execute(&connection)?;
        
        let id = diesel::select(last_insert_rowid)
            .get_result::<i32>(&connection)?;

        return Ok(id);
    }

    fn get_all_schedules(&self) -> Result<Vec<DBSchedule>, DBError> {
        let connection = self.pool.get().expect("Failed to get connection");

        return Ok(schedule::table.load::<DBSchedule>(&connection)?);
    }

    fn update_schedule<T: Into<DBSchedule>>(&self, schedule: T) -> Result<(), DBError> {
        let connection = self.pool.get().expect("Failed to get connection");
        let schedule: DBSchedule = schedule.into();

        if !is_valid_cron(&schedule.schedule_cron) {
            return Err(DBError::InvalidData);
        }

        diesel::update(schedule::table)
            .filter(schedule::id.eq(&schedule.id))
            .set((schedule::title.eq(&schedule.title), 
                        schedule::name_template.eq(&schedule.name_template),
                        schedule::schedule_cron.eq(&schedule.schedule_cron),
                        schedule::enabled.eq(&schedule.enabled),
            ))
            .execute(&connection)?;
        Ok(())
    }
}

impl Clone for SQLLiteDBConnection {
    fn clone(&self) -> SQLLiteDBConnection {
        SQLLiteDBConnection {
            pool: self.pool.clone(),
        }
    }
}
