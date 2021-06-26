table! {
    note_links (id) {
        id -> Integer,
        from_id -> Text,
        to_id -> Text,
        from_note_index -> Text,
    }
}

table! {
    notes (id) {
        id -> Text,
        title -> Text,
        contents -> Text,
        daily -> Bool,
        cdate -> BigInt,
        edate -> BigInt,
    }
}

table! {
    schedule (id) {
        id -> Integer,
        title -> Text,
        name_template -> Text,
        schedule_cron -> Text,
        enabled -> Bool,
    }
}

allow_tables_to_appear_in_same_query!(
    note_links,
    notes,
    schedule,
);
