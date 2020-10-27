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
    }
}

allow_tables_to_appear_in_same_query!(
    note_links,
    notes,
);
