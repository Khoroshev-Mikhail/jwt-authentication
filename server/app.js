const express = require("express");
const app = express()
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});
app.use(express.json())
app.get('/', (req, res) => {
    return res.status(200).json('Connection is good!')
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