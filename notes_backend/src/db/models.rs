use super::schema::notes;

#[derive(Insertable, Queryable)]
#[table_name="notes"]
pub struct DBNote {
    pub id: String,
    pub title: String,
    pub contents: String,
    pub daily: bool,
}
