#[macro_use]
extern crate diesel;
#[macro_use]
extern crate diesel_migrations;
#[macro_use]
extern crate slog;

mod db;
mod routes;
mod schedule;

use clap::{App, Arg};
use db::DBConnection;
use schedule::{NoteScheduler, Schedule};
use std::net::ToSocketAddrs;

use atty::Stream;
use slog::Drain;

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
    
    // If we're running in a terminal, use slog term,
    // otherwise the output is being piped so use slog_json
    let drain = if atty::is(Stream::Stdout) {
        slog_async::Async::new(slog_term::CompactFormat::new(slog_term::TermDecorator::new().build()).build().fuse()).build().fuse()
    }
    else {
        slog_async::Async::new(slog_json::Json::new(std::io::stdout())
        .add_default_keys()
        .build()
        .fuse()).build().fuse()
    };

    let log = slog::Logger::root(drain, o!("format" => "pretty"));

    // Parse out the listen address
    let address = matches.value_of("listen").unwrap();
    let address: Vec<_> = match address.to_socket_addrs() {
        Ok(addr) => addr.collect(),
        Err(e) => {
            error!(log, "Failed to parse socket address from {}: {}", address, e);
            return;
        }
    };

    info!(log, "Listening on: {:?}", address);

    let (mut note_scheduler, tx) = NoteScheduler::new();

    let pool = match db::SQLLiteDBConnection::new(matches.value_of("db").unwrap()) {
        Ok(p) => p,
        Err(e) => {
            error!(log, "Failed to create DB connection: {}", e);
            return;
        }
    };

    match pool.run_migrations() {
        Ok(_) => {},
        Err(e) => {
            error!(log, "Failed to run migrations: {}", e);
            return;
        }
    };

    let routes = routes::get_routes(pool.clone(), tx);

    let futures = address
        .into_iter()
        .map(move |addr| warp::serve(routes.clone()).run(addr));

    tokio::join!(futures::future::join_all(futures), note_scheduler.run(log, pool));
}
