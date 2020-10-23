CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR UNIQUE NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    contents VARCHAR NOT NULL,
    daily BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS note_links (
    id INTEGER UNIQUE NOT NULL PRIMARY KEY,
    from_id VARCHAR NOT NULL,
    to_id VARCHAR NOT NULL,
    from_note_index VARCHAR NOT NULL
);

CREATE INDEX IF NOT EXISTS note_links_from_index ON note_links (from_id);
CREATE INDEX IF NOT EXISTS note_links_to_index ON note_links (to_id);
