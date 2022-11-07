const express = require("express");
const app = express()
const pgp = require('pg-promise')();
const jsonParser = express.json()
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
app.use(function(req, res, next) {
    // req.user = true
    next();
});
app.use(express.json())
app.get('/', (req, res) => {
    try {
        return res.status(200).json('Connection is good!')
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
})
app.get('/checkAuth', (req, res) => {
    try {
        if(!req.user){
            throw new Error('Вы не авторизированны!')
        }
        return res.status(200).json('Авторизирован!')
    } 
    catch(e) {
        return res.status(500).send(e.message)
    }
})
app.get('/users', async (req, res) => {
    try {
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
        const token = 'token for ara'
        const user = await db.one('SELECT id, user_login FROM users WHERE user_login = $1 AND user_password = $2', [login, password]);
        const getToken = await db.none('UPDATE users SET token = $1 WHERE id = $2', [token, user.id])
        return res.status(200).send({...user, token})
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