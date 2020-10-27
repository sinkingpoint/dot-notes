mod models;
mod schema;

use super::api::Note;
use chrono::prelude::*;
use diesel::prelude::*;
use diesel::r2d2::{self, ConnectionManager, Pool};
pub use models::DBNote;
use rand::Rng;
use schema::notes;

embed_migrations!();

pub trait DBConnection {
    fn run_migrations(&self) -> Result<(), diesel_migrations::RunMigrationsError>;
    fn create_note(&self) -> Result<String, diesel::result::Error>;
    fn update_note(&self, note: &Note) -> Result<(), diesel::result::Error>;
    fn get_note(&self, id: &str) -> Result<Option<DBNote>, diesel::result::Error>;
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

    fn create_note(&self) -> Result<String, diesel::result::Error> {
        let connection = self.pool.get().expect("Failed to get connection");
        let mut rng = rand::thread_rng();
        let chars = [
            'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
            'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
            'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y',
            'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
        ];
        let new_id: String = {
            let mut build = String::new();
            for _ in 0..32 {
                build.push(chars[rng.gen::<usize>() % chars.len()]);
            }

            build
        };

        let now: i64 = Utc::now().timestamp();

        diesel::insert_into(notes::table)
            .values(DBNote {
                id: new_id.clone(),
                title: "New Note".to_owned(),
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

    fn get_note(&self, id: &str) -> QueryResult<Option<DBNote>> {
        let connection = self.pool.get().expect("Failed to get connection");
        notes::table
            .filter(notes::id.eq(id))
            .limit(1)
            .load::<DBNote>(&connection)
            .map(|res| res.into_iter().next())
    }
}

impl Clone for SQLLiteDBConnection {
    fn clone(&self) -> SQLLiteDBConnection {
        SQLLiteDBConnection {
            pool: self.pool.clone(),
        }
    }
}
