use std::env;

pub fn fetch_inbox_top() -> imap::error::Result<Option<String>> {
    // Try to load from .env if present, continue if not found
    if let Ok(path) = env::var("CARGO_MANIFEST_DIR") {
        let env_path = std::path::Path::new(&path).join(".env");
        if env_path.exists() {
            dotenv::from_path(env_path).ok();
        }
    }

    let domain = env::var("IMAP_DOMAIN").expect("IMAP_DOMAIN environment variable must be set");
    let username =
        env::var("IMAP_USERNAME").expect("IMAP_USERNAME environment variable must be set");
    let password =
        env::var("IMAP_PASSWORD").expect("IMAP_PASSWORD environment variable must be set");
    let port = env::var("IMAP_PORT")
        .expect("IMAP_PORT environment variable must be set")
        .parse::<u16>()
        .expect("IMAP_PORT must be a valid port number");

    let client = imap::ClientBuilder::new(&domain, port)
        // .mode(imap::ConnectionMode::Tls)
        .danger_skip_tls_verify(true)
        .connect()?;

    let mut imap_session = client.login(&username, &password).map_err(|e| e.0)?;

    imap_session.debug = true;
    imap_session.select("INBOX")?;

    let messages = imap_session.fetch("1", "RFC822")?;
    let message = if let Some(m) = messages.iter().next() {
        m
    } else {
        return Ok(None);
    };

    // extract the message's body
    let body = message.body().expect("message did not have a body!");
    let body = std::str::from_utf8(body)
        .expect("message was not valid utf-8")
        .to_string();

    // be nice to the server and log out
    imap_session.logout()?;

    Ok(Some(body))
}

pub fn listen_for_emails() -> imap::error::Result<()> {
    // Try to load from .env if present, continue if not found
    if let Ok(path) = env::var("CARGO_MANIFEST_DIR") {
        let env_path = std::path::Path::new(&path).join(".env");
        if env_path.exists() {
            dotenv::from_path(env_path).ok();
        }
    }

    let domain = env::var("IMAP_DOMAIN").expect("IMAP_DOMAIN environment variable must be set");
    let username =
        env::var("IMAP_USERNAME").expect("IMAP_USERNAME environment variable must be set");
    let password =
        env::var("IMAP_PASSWORD").expect("IMAP_PASSWORD environment variable must be set");
    let port = env::var("IMAP_PORT")
        .expect("IMAP_PORT environment variable must be set")
        .parse::<u16>()
        .expect("IMAP_PORT must be a valid port number");

    let client = imap::ClientBuilder::new(&domain, port)
        // .mode(imap::ConnectionMode::Tls)
        .danger_skip_tls_verify(true)
        .connect()?;

    let mut imap_session = client.login(&username, &password).map_err(|e| e.0)?;

    imap_session.debug = true;

    imap_session
        .select("INBOX")
        .expect("Could not select mailbox");

    let mut num_responses = 0;
    let max_responses = 5;
    let idle_result = imap_session.idle().wait_while(|response| {
        num_responses += 1;
        println!("IDLE response #{}: {:?}", num_responses, response);

        if let imap::types::UnsolicitedResponse::Recent(uid) = response {
            println!("Recent uid: {:?}", uid);
        }

        if num_responses >= max_responses {
            // Stop IDLE
            false
        } else {
            // Continue IDLE
            true
        }
    });

    match idle_result {
        Ok(reason) => println!("IDLE finished normally {:?}", reason),
        Err(e) => println!("IDLE finished with error {:?}", e),
    }

    imap_session.logout().expect("Could not log out");

    Ok(())
}
