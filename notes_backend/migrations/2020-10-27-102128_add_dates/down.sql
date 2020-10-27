-- This file should undo anything in `up.sql`
ALTER TABLE notes RENAME TO "notes_old";
CREATE TABLE notes (
    id VARCHAR UNIQUE NOT NULL PRIMARY KEY,
    title VARCHAR NOT NULL,
    contents VARCHAR NOT NULL,
    daily BOOLEAN NOT NULL
);

INSERT INTO notes (id, title, contents, daily) SELECT id, title, contents, daily FROM notes_old;

DROP TABLE notes_old;