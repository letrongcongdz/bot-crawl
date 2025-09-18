CREATE TABLE company_threads (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE
);
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    reviewer VARCHAR NOT NULL,
    content TEXT NOT NULL,
    origin_id VARCHAR NOT NULL UNIQUE,
    is_sent BOOLEAN DEFAULT FALSE,
    company_thread_id INTEGER NOT NULL,
    CONSTRAINT fk_company_thread
        FOREIGN KEY (company_thread_id)
        REFERENCES company_threads(id)
        ON DELETE CASCADE
);
CREATE TABLE replies (
    id SERIAL PRIMARY KEY,
    reviewer VARCHAR NOT NULL,
    content TEXT NOT NULL,
    reply_origin_id VARCHAR NOT NULL UNIQUE,
    post_id INTEGER NOT NULL,
    CONSTRAINT fk_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE
);

