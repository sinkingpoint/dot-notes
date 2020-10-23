-- This file should undo anything in `up.sql`

DROP INDEX note_links_to_index;
DROP INDEX note_links_from_index;
DROP TABLE note_links;
DROP TABLE notes;