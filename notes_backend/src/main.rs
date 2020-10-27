#[macro_use]
extern crate diesel;
#[macro_use]
extern crate diesel_migrations;

mod api;
mod db;

use clap::{App, Arg};
use std::net::ToSocketAddrs;
use db::DBConnection;

#[tokio::main]
async fn main() {
    let matches = App::new("notes-thing backend")
                        .arg(Arg::with_name("listen")
                                .short("l")
                                .help("The address/port to listen on")
                                .takes_value(true)
                                .default_value("localhost:4278")
                            )
                        .arg(Arg::with_name("db")
                            .short("d")
                            .help("The location of the SQLLite DB to use")
                            .takes_value(true)
                            .default_value("noot.sqllite")
                        ).get_matches();

    // Parse out the listen address
    let address =  matches.value_of("listen").unwrap();
    let address: Vec<_>  = match address.to_socket_addrs() {
        Ok(addr) => addr.collect(),
        Err(e) => {
            eprintln!("Failed to parse socket address from {}: {}", address, e);
            return;
        }
    };

    let pool = db::SQLLiteDBConnection::new(matches.value_of("db").unwrap()).expect("Failed to create pool");
    pool.run_migrations().expect("Failed to run migrations");

    let routes = api::get_api(pool);

    // Listen. Note that if the listen address expands to multiple IP addresses
    // we only listen on the first one, which might be stochastic depending on the auth
    // resolver
    warp::serve(routes)
        .run(address[0])
        .await;
}
