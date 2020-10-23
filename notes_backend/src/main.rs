mod api;

use clap::{App, Arg};
use std::net::ToSocketAddrs;

#[tokio::main]
async fn main() {
    let matches = App::new("notes-thing backend")
                        .arg(Arg::with_name("listen")
                                .short("l")
                                .help("The address/port to listen on")
                                .takes_value(true)
                                .default_value("localhost:4278")
                            ).get_matches();

    let routes = api::get_api();

    // Parse out the listen address
    let address =  matches.value_of("listen").unwrap();
    let address: Vec<_>  = match address.to_socket_addrs() {
        Ok(addr) => addr.collect(),
        Err(e) => {
            eprintln!("Failed to parse socket address from {}: {}", address, e);
            return;
        }
    };

    // Listen. Note that if the listen address expands to multiple IP addresses
    // we only listen on the first one, which might be stochastic depending on the auth
    // resolver
    warp::serve(routes)
        .run(address[0])
        .await;
}
