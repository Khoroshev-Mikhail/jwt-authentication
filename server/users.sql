-- \i /Users/tatanaarhipova/MikeIT/jwt-authentication/server/users.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_login VARCHAR(25), /*Добавить уникальность*/
    user_password VARCHAR(25), /*Добавить уникальность*/
    token VARCHAR(100) DEFAULT NULL, /*Добавить уникальность*/
    refresh_token VARCHAR(100) DEFAULT NULL /*Добавить уникальность*/
);

INSERT INTO "users" ("user_login", "user_password") VALUES ('Ara', 'Araara14');