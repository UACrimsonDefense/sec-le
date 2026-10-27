CREATE TABLE history (
	user_id INTEGER NOT NULL,
	key TEXT NOT NULL,
	term_id INTEGER NOT NULL,
	day INTEGER NOT NULL,
	mode TEXT NOT NULL,
	objective TEXT NOT NULL,
	difficulty TEXT NOT NULL,
	result TEXT NOT NULL,
	guesses INTEGER NOT NULL,
	date TEXT NOT NULL,
	game TEXT,
	source TEXT NOT NULL,
	PRIMARY KEY (user_id, key)
);

CREATE TABLE settings (
	user_id INTEGER PRIMARY KEY,
	difficulty TEXT NOT NULL,
	theme TEXT NOT NULL,
	colorblind INTEGER NOT NULL,
	updated INTEGER NOT NULL
);
