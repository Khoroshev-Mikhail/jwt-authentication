if(req.headers.authorization && req.headers.authorization !== 'Bearer unknown unknown'){
    const headers = req.headers.authorization.split(' ')
    const headersToken = headers[1]
    const headersRefresh = headers[2]
    
    jwt.verify(headersToken, SECRET, async function(err, decoded) {
        const user = await db.one('SELECT id, user_login, token, refresh_token FROM users WHERE id = $1', [decoded.id]);
        if(user.token === headersToken){
            if(new Date().getMinutes() - new Date(decoded.date).getMinutes() < 600){
                req.user = true;
                next()
            } else{
                if(user.refresh_token === headersRefresh){
                    jwt.verify(headersRefresh, SECRET_REFRESH, async function(err, decoded) {
                        if(new Date().getHours() - new Date(decoded.date).getHours() < 600){
                            const newToken = jwt.sign({ id: user.id, date: new Date() }, SECRET);
                            const newRefreshToken = jwt.sign({ id: user.id, date: new Date() }, SECRET_REFRESH);   
                            await db.none('UPDATE users SET token = $1, refresh_token = $2 WHERE id = $3', [newToken, newRefreshToken, user.id])
                            req.user = await db.one('SELECT id, user_login, token, refresh_token FROM users WHERE id = $1', [id]);
                            next() 
                        }else{
                            req.user = null;
                            next()
                        }
                    });
                }
            }
        }
    });
} else{
    req.user = null;
    next();
}