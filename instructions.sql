CREATE TABLE saved_queries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sql TEXT NOT NULL
);