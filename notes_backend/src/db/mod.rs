mod models;
mod schema;

use super::api::Note;
use rand::Rng;
use diesel::prelude::*;
use chrono::prelude::*;
use schema::notes;
pub use models::DBNote;
use diesel::r2d2::{self, ConnectionManager, Pool};

embed_migrations!();

pub trait DBConnection {
    fn run_migrations(&self) -> Result<(), diesel_migrations::RunMigrationsError>;
    fn put_note(&self, note: &Note) -> Result<Option<String>, diesel::result::Error>;
    fn get_note(&self, id: &str) -> Result<Option<DBNote>, diesel::result::Error>;
}

pub struct SQLLiteDBConnection {
    pool: Pool<ConnectionManager<SqliteConnection>>
}

impl SQLLiteDBConnection {
    pub fn new(path: &str) -> Result<SQLLiteDBConnection, r2d2::PoolError>{
        let manager = ConnectionManager::<SqliteConnection>::new(path);
        let pool = Pool::builder().max_size(1).build(manager)?;
    
        return Ok(SQLLiteDBConnection{
            pool: pool
        });
    }
}

impl DBConnection for SQLLiteDBConnection {
    fn run_migrations(&self) -> Result<(), diesel_migrations::RunMigrationsError>{
        let connection = self.pool.get().expect("Failed to get connection");
        match embedded_migrations::run(&connection) {
            Ok(()) => Ok(()),
            Err(e) => Err(e)
        }
    }

    fn put_note(&self, note: &Note) -> Result<Option<String>, diesel::result::Error>{
        let connection = self.pool.get().expect("Failed to get connection");
        let contents = serde_json::to_string(&note.contents).unwrap();
        if note.id.is_some() {
            diesel::update(notes::table).filter(notes::id.eq(note.id.as_ref().unwrap())).set((notes::title.eq(&note.title), notes::contents.eq(&contents))).execute(&connection)?;
            return Ok(None);
        }
        else {
            let mut rng = rand::thread_rng();
            let chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            let new_id: String = {
                let mut build = String::new();
                for _ in 0..32 {
                    build.push(chars[rng.gen::<usize>() % chars.len()]);
                }

                build
            };

            let now: i64 = Utc::now().timestamp();

            diesel::insert_into(notes::table).values(DBNote{
                id: new_id.clone(),
                title: note.title.clone(),
                contents: contents,
                daily: false,
                cdate: now,
                edate: now,
            }).execute(&connection)?;

            return Ok(Some(new_id));
        }
    }

    fn get_note(&self, id: &str) -> QueryResult<Option<DBNote>> {
        let connection = self.pool.get().expect("Failed to get connection");
        return notes::table.filter(notes::id.eq(id)).limit(1).load::<DBNote>(&connection).and_then(|res| {
            return Ok(res.into_iter().next());
        });
    }
}

impl Clone for SQLLiteDBConnection {
    fn clone(&self) -> SQLLiteDBConnection {
        return SQLLiteDBConnection {
            pool: self.pool.clone()
        }
    }
}