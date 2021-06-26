#[macro_use]
extern crate diesel;
#[macro_use]
extern crate diesel_migrations;

mod db;
mod routes;
mod schedule;

use clap::{App, Arg};
use db::DBConnection;
use schedule::{NoteScheduler, Schedule};
use std::net::ToSocketAddrs;

#[tokio::main]
async fn main() {
    env_logger::init();
    let matches = App::new("notes-thing backend")
        .arg(
            Arg::with_name("listen")
                .short("l")
                .help("The address/port to listen on")
                .takes_value(true)
                .default_value("localhost:4278"),
        )
        .arg(
            Arg::with_name("db")
                .short("d")
                .help("The location of the SQLLite DB to use")
                .takes_value(true)
                .default_value("noot.sqllite"),
        )
        .get_matches();

    // Parse out the listen address
    let address = matches.value_of("listen").unwrap();
    let address: Vec<_> = match address.to_socket_addrs() {
        Ok(addr) => addr.collect(),
        Err(e) => {
            eprintln!("Failed to parse socket address from {}: {}", address, e);
            return;
        }
    };

    let note_scheduler = NoteScheduler::new(vec![Schedule::new("test-%M".to_owned(), "* * * * *").unwrap()]);

    let pool = db::SQLLiteDBConnection::new(matches.value_of("db").unwrap())
        .expect("Failed to create pool");
    pool.run_migrations().expect("Failed to run migrations");

    let routes = routes::get_routes(pool.clone());

    let futures = address
        .into_iter()
        .map(move |addr| warp::serve(routes.clone()).run(addr));

    tokio::join!(futures::future::join_all(futures), note_scheduler.run(pool));
}
