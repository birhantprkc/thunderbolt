use mozilla_assist_lib::imap_client;

fn main() {
    // Handle the Result and Option types
    match imap_client::listen_for_emails() {
        Ok(_) => println!("Listening for emails"),
        Err(e) => eprintln!("Error: {}", e),
    }
}
