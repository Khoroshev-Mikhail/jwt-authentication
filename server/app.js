const express = require("express");
const app = express()
const pgp = require('pg-promise')();
const jsonParser = express.json()
var jwt = require('jsonwebtoken');
const SECRET = 'Ara'
const TOKEN_LIFE_TIME = 1;
const SECRET_REFRESH = 'Bara'
const REFRESH_LIFE_HOURS = 100;
const db = pgp({
    host:       'localhost',
    port:       5432,
    database:   'testauth',
    user:       'postgres',
    password:   '12345'
});

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});
app.use(express.json())

//!!! Переписать без return на cb()
// Вдруг токен === null и в бд тоже null === тогда при сопоставлении будет тру
app.use(async function(req, res, next) {
    if(req.headers.authorization && req.headers.authorization.split(' ').length == 3 && req.headers.authorization !== 'Bearer unknown unknown'){
        const headers = req.headers.authorization.split(' ')
        const headersToken = headers[1]
        const headersRefresh = headers[2]
        if(!headersToken || !headersRefresh){
            req.user = null;
            next()
        }
        jwt.verify(headersToken, SECRET, async function(err, decoded) {
            if(err || !decoded){
                req.user = null;
                next();
            }else{
                const user = await db.one('SELECT id, user_login, token, refresh_token FROM users WHERE id = $1', [decoded.id]);
                if(user.token === headersToken && new Date().getMinutes() - new Date(decoded.date).getMinutes() < TOKEN_LIFE_TIME){
                    req.user = true;
                    next()
                }else{
                    req.user = null;
                    next();
                }
            }
        });
    } else{
        req.user = null;
        next();
    }
});

app.post('/checkToken', (req, res) => {
    try {
        if(req.body.token){
            const headersToken = req.body.token
            jwt.verify(headersToken, SECRET, async function(err, decoded) {
                if(err || !decoded){
                    return res.sendStatus(500)
                }
                const user = await db.one('SELECT id, user_login, token, refresh_token FROM users WHERE id = $1', [decoded.id]);
                if(user.token === headersToken && new Date().getMinutes() - new Date(decoded.date).getMinutes() < TOKEN_LIFE_TIME){
                    return res.sendStatus(200)
                }else{
                    return res.sendStatus(426)
                }
            });
        } else{
            return res.sendStatus(500)
        }
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
})
app.post('/refreshToken', (req, res) => {
    try {
        if(req.body.token && req.body.refreshToken){
            const headersToken = req.body.token
            const headersRefresh = req.body.refreshToken
            jwt.verify(headersToken, SECRET, async function(err, decoded) {
                if(err || !decoded){
                    return res.sendStatus(500)
                }
                const user = await db.one('SELECT id, user_login, token, refresh_token FROM users WHERE id = $1', [decoded.id]);
                if(user.refresh_token === headersRefresh && new Date().getHours() - new Date(decoded.date).getHours() < REFRESH_LIFE_HOURS){
                    const date = new Date()
                    const newToken = jwt.sign({ id: user.id, date }, SECRET);  
                    const newRefresh = jwt.sign({ id: user.id, date }, SECRET_REFRESH);   
                    await db.none('UPDATE users SET token = $1, refresh_token = $2 WHERE id = $3', [newToken, newRefresh, user.id])
                    return res.status(200).send({newToken, newRefresh, jwtExpire: date})
                }else{
                    return res.sendStatus(426)
                }
                
            });
        } else{
            return res.sendStatus(400)
        }
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
})

app.get('/', (req, res) => {
    try {
        // console.log('/', req.user)
        return res.status(200).json('Connection is good!')
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
})
app.get('/checkAuth', (req, res) => {
    try {
        // console.log('/checkauth', req.user)
        if(!req.user){
            return res.sendStatus(401)
        }
        return res.status(200).json('Авторизирован!')
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
})
app.get('/users', async (req, res) => {
    try {
        // console.log('/users', req.user)
        const data = await db.any('SELECT * FROM users');
        return res.status(200).send(data)
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
})
app.post('/auth', jsonParser, async (req, res) => {
    try {
        const { password, login } = req.body
        const user = await db.one('SELECT id, user_login FROM users WHERE user_login = $1 AND user_password = $2', [login, password]);
        const date = new Date();
        const token = jwt.sign({ id: user.id, date }, SECRET);   
        const refreshToken = jwt.sign({ id: user.id, date }, SECRET_REFRESH);   
        await db.none('UPDATE users SET token = $1, refresh_token = $2 WHERE id = $3', [token, refreshToken, user.id])
        return res.status(200).send({id: user.id, login: user.user_login, token, refreshToken, jwtExpire: date});
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
})
app.get('/logout/:id', async (req, res) => {
    try {
        // console.log('/logout', req.user)
        await db.none('UPDATE users SET token = $1, refresh_token = $1 WHERE id = $2', [null, req.params.id])
        return res.status(200).send({id: 0, login: 'unknown', token: null, refreshToken: null});
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
})
app.get('/any', async (req, res) => {
    try {
        if(!req.user){
            return res.sendStatus(401)
        }
        return res.sendStatus(500)
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
    
    
})
app.get('/clearToken', jsonParser, async (req, res) => {
    try {
        await db.none('UPDATE users SET token = $1, refresh_token = $1 WHERE id = $2', [null, 1])
        return res.sendStatus(200)
    }
    catch(e) {
        return res.status(500).send(e.message)
    }
})
const start = async () => {
    try{
        app.listen(4000, ()=>{
            console.log(`Сервер ожидает запросов на порте ${4000}`)
        })
    }catch(e){
        console.error(e)
    }
}
start()