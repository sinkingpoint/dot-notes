use saffron::{Cron, parse};
use chrono::DateTime;
use tokio::time::delay_for;

use crate::db::{DBConnection, SQLLiteDBConnection};

pub struct Schedule {
  name: String,
  cron: Cron
}

impl Schedule {
  pub fn new(name: String, cron: &str) -> Result<Schedule, parse::CronParseError>{
    Ok(Self {
      name,
      cron: match cron.parse() {
        Ok(c) => c,
        Err(e) => {
          println!("{:?}", e);
          return Err(e)
        }
      }
    })
  }

  fn get_next_time(&self) -> Option<DateTime<chrono::Utc>> {
    self.cron.next_after(chrono::Utc::now())
  }
}

pub struct NoteScheduler {
  schedules: Vec<Schedule>
}

impl NoteScheduler {
  pub fn new(schedules: Vec<Schedule>) -> NoteScheduler {
    return NoteScheduler {
      schedules
    }
  }

  fn get_next_to_fire(&self) -> Option<(DateTime<chrono::Utc>, impl Iterator<Item=&Schedule>)> {
    let min_time = self.schedules.iter().map(|s| s.get_next_time()).filter(|t| t.is_some()).map(|t| t.unwrap()).min();
    if let Some(time) = min_time {
      Some((time, self.schedules.iter().filter(move |s| s.get_next_time() == Some(time))))
    }
    else {
      None
    }
  }

  pub async fn run(&self, db: SQLLiteDBConnection) {
    loop {
      if let Some((time, nexts)) = self.get_next_to_fire() {
        let diff = time.signed_duration_since(chrono::Utc::now());
        println!("Waiting {} for next schedule", diff);
        delay_for(diff.to_std().unwrap()).await;

        let now = chrono::Utc::now();

        for next in nexts {
          // Go through all the schedules that just fired and create their pages
          let name = now.format(&next.name).to_string();
          match db.create_note(name) {
            Ok(_) => {},
            Err(_) => {
              // Silently skip if the name duplicates for now,
              // TODO: Error logging
            }
          }
        }
      }
      else {
        return;
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use chrono::{Duration, NaiveDateTime};

  use super::*;

  // Helper function to return the current time, rounded up to the next increment of `time`
  fn round_time(time: Duration) -> DateTime<chrono::Utc> {
    let dur_seconds = time.num_seconds();
    let ticks = (chrono::Utc::now().timestamp() + dur_seconds - 1) / dur_seconds * dur_seconds;

    return chrono::DateTime::from_utc(NaiveDateTime::from_timestamp(ticks, 0), chrono::Utc);
  }

  #[test]
  fn test_new_schedule() {
      assert!(Schedule::new("test".to_owned(), "cats").is_err());
      assert!(Schedule::new("test".to_owned(), "* * * *").is_err());
      assert!(Schedule::new("test".to_owned(), "* * * * * *").is_err());
      assert!(Schedule::new("test".to_owned(), "0 * * * *").is_ok());
      assert!(Schedule::new("test".to_owned(), "1 1 1 1 *").is_ok());
  }


  #[test]
  fn test_schedule_next_time() {
    let test = Schedule::new("test".to_owned(), "*/5 * * * *").expect("Invalid Cron");
    let test_next = test.get_next_time();

    assert!(test_next.is_some());
    assert_eq!(test_next.unwrap(), round_time(Duration::minutes(5)));
  }
}