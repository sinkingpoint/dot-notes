use chrono::{DateTime, Duration};
use slog::Logger;
use tokio::{sync::mpsc, time::delay_for};

use std::sync::Arc;
use std::str::FromStr;
use futures::lock::Mutex;

use crate::db::{DBConnection, DBSchedule, SQLLiteDBConnection};

pub fn is_valid_cron(cron: &str) -> bool {
  cron::Schedule::from_str(cron).is_ok()
}

pub struct Schedule {
  id: i32,
  name: String,
  enabled: bool,
  cron: cron::Schedule
}

impl From<DBSchedule> for Schedule {
  fn from(schedule: DBSchedule) -> Self {
    return Schedule::new(schedule.id, schedule.name_template, &schedule.schedule_cron, schedule.enabled).unwrap();
  }
}

impl Schedule {
  pub fn new(id: i32, name: String, cron: &str, enabled: bool) -> Result<Schedule, cron::error::Error>{
    // Hack ahoy: The cron library we use expects a second on the front and 
    // a year on the end. We might not have one, so add them. See https://github.com/zslayton/cron/issues/13
    let mut cron = cron.to_owned();
    if cron.split_ascii_whitespace().count() == 5 {
        cron = format!("0 {} *", cron);
    }

    Ok(Self {
      id,
      name,
      enabled,
      cron: match cron::Schedule::from_str(&cron) {
        Ok(c) => c,
        Err(e) => {
          return Err(e)
        }
      }
    })
  }

  fn get_next_time(&self) -> Option<DateTime<chrono::Local>> {
    if !self.enabled {
      return None;
    }

    self.cron.upcoming(chrono::Local).next()
  }
}

fn get_next_to_fire(schedules: &Vec<Schedule>) -> Option<(DateTime<chrono::Local>, Vec<String>)> {
  let times: Vec<(&Schedule, DateTime<chrono::Local>)> = schedules.iter().filter_map(|s| {
    match s.get_next_time() {
      Some(time) => Some((s, time)),
      None => None
    }
  }).collect();

  if let Some(&min_time) = times.iter().map(|(_, time)| time).min() {
    let schedules: Vec<String> = times.into_iter().filter_map(move |(s, time)| {
      if time == min_time {
        return Some(s.name.clone());
      }

      return None;
    }).collect();

    return Some((min_time, schedules))
  }
  else {
    None
  }
}

pub struct NoteScheduler {
  changes: Option<mpsc::Receiver<(Schedule, bool)>>,

}

impl NoteScheduler {
  pub fn new() -> (NoteScheduler, mpsc::Sender<(Schedule, bool)>) {
    let (tx, rx) = mpsc::channel(100);
    return (NoteScheduler {
      changes: Some(rx)
    }, tx)
  }

  async fn schedule_loop(&self, log: Logger, db: SQLLiteDBConnection, schedules: Arc<Mutex<Vec<Schedule>>>) {
    loop {
      let next = {
        let schedules = schedules.lock().await;
        get_next_to_fire(&schedules)
      };

      if let Some((time, nexts)) = next {
        let diff = time.signed_duration_since(chrono::Utc::now());
        info!(log, "Waiting {} to create {} notes", diff, nexts.len());
        delay_for(diff.to_std().unwrap()).await;

        let now = chrono::Utc::now();

        for next in nexts {
          // Go through all the schedules that just fired and create their pages
          let name = now.format(&next).to_string();
          match db.create_note(&name) {
            Ok(_) => {},
            Err(e) => {
              error!(log, "Failed to create note `{}`: {:?}", name, e);
            }
          }
        }
      }
      else {
        // We have no valid schedules, sleep for a day (An arbitrarily long time)
        delay_for(Duration::hours(24).to_std().unwrap()).await;
      }
    }
  }

  pub async fn run(&mut self, log: Logger, db: SQLLiteDBConnection) {
    let schedules: Arc<Mutex<Vec<Schedule>>> = Arc::new(Mutex::new(db.get_all_schedules().unwrap().into_iter().map(|s| s.into()).collect()));
    let mut changes = self.changes.take().unwrap();

    let (mut shutdowntx, mut shutdownrx) = mpsc::channel(5);
    
    let schedule_modifier = schedules.clone();
    tokio::spawn(async move {
      while let Some((schedule, add)) = changes.recv().await {
        let mut schedules = schedule_modifier.lock().await;
        if add {
          let mut found = false;
          for sched in schedules.iter_mut() {
            if sched.id == schedule.id {
              found = true;
              sched.enabled = schedule.enabled;
              sched.name = schedule.name.clone();
              sched.cron = schedule.cron.clone();
            }
          }

          if !found {
            schedules.push(schedule);
          }
        }
        else {
          for (i, sched) in schedules.iter().enumerate() {
            if sched.id == schedule.id {
              schedules.remove(i);
              break;
            }
          }
        }

        shutdowntx.send(true).await.expect("Failed to send shutdown");
      }
    });

    loop {
      let run_loop = self.schedule_loop(log.clone(), db.clone(), schedules.clone());

      // Select on the shutdownrx so that we recreate the schedule loop when a change happens
      tokio::select! {
        _ = run_loop => {
          error!(log, "Scheduling loop exited")
        },
        _ = shutdownrx.recv() => {
          info!(log, "Schedule change received. SIGHUP'd the run_loop task");
        }
      };
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
      assert!(Schedule::new(0, "test".to_owned(), "cats", true).is_err());
      assert!(Schedule::new(0, "test".to_owned(), "* * * *", true).is_err());
      assert!(Schedule::new(0, "test".to_owned(), "* * * * * *", true).is_err());
      assert!(Schedule::new(0, "test".to_owned(), "0 * * * *", true).is_ok());
      assert!(Schedule::new(0, "test".to_owned(), "1 1 1 1 *", true).is_ok());
  }

  #[test]
  fn test_schedule_next_time() {
    let test = Schedule::new(0, "test".to_owned(), "*/5 * * * *", true).expect("Invalid Cron");
    let test_next = test.get_next_time();

    assert!(test_next.is_some());
    assert_eq!(test_next.unwrap(), round_time(Duration::minutes(5)));
  }
}