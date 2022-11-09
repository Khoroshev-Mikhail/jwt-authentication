import { configureStore, ThunkAction, Action, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
const TOKEN_LIFE_TIME = 1;

export type User = {
  id: string | number, 
  login: string
}
export const loginThunk = createAsyncThunk(
  'loginThunk',
  async function(obj: any) {
      const response = await fetch('http://localhost:4000/auth', {
          method: 'POST',            
          headers: {
              'Content-Type': 'application/json;charset=utf-8'
          }, 
          body: JSON.stringify({password: obj.password, login: obj.login})
      })
      const data = await response.json()
      if(response.ok){
          localStorage.setItem('id', data.id);
          localStorage.setItem('login', data.login);
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          localStorage.setItem('jwtExpire', data.jwtExpire);
      }
      const {id, login} = data
      return {id, login}
  }
)
export const exitThunk = createAsyncThunk(
  'exitThunk',
  async function() {
      const response = await fetch(`http://localhost:4000/logout/${localStorage.getItem('id')}`)//Обратиться с стейт напрямую, и взять оттуда id
      const data = await response.json()
      if(response.ok){
        localStorage.removeItem('id')
        localStorage.removeItem('login')
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('jwtExpire')
      }
      return data
  }
)
const user: User = {
  id: localStorage.getItem('id') || 0, 
  login: localStorage.getItem('login') || 'unknown', 
}
const userSlice = createSlice({
  name: 'userSlice',
  initialState: user,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loginThunk.fulfilled, (_, action) => action.payload)
    builder.addCase(loginThunk.rejected, (_, __) => {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('jwtExpire')
      return { id: 0, login: 'unknown' }
    })
    builder.addCase(exitThunk.fulfilled, (_, action) => action.payload)
  }
})
export const anyThunk = createAsyncThunk(
  'anyThunk',
  async function() {
      const response = await fetch('http://localhost:4000/any', {         
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')} ${localStorage.getItem('refreshToken')}`
          }
      })
      return response.status
  }
)
const checkToken = (store: any) => (next: any) => (action: any) => {
  const result = next(action)
  if(action.type.includes('userSlice')){
    return result
  }
  console.log('МидлВейр:', action, store.getState())
  console.log(new Date().getMinutes() - new Date(localStorage.getItem('jwtExpire') || new Date()).getMinutes() >= TOKEN_LIFE_TIME)
  if(localStorage.getItem('jwtExpire') && new Date().getMinutes() - new Date(localStorage.getItem('jwtExpire') || new Date()).getMinutes() >= TOKEN_LIFE_TIME){
    console.log('Токен необходимо обновить, запрашиваю новый токен:')
    fetch('http://localhost:4000/checkToken', {         
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        }, 
        body: JSON.stringify({token: localStorage.getItem('token')})
    })
    .then((res) =>{
      if(res.status === 200) {
        console.log('Сервер ответил что токен действителен!')
      }
      if(res.status === 426){
          console.log('Сервер подтвердил информацию о просрочке токена!')
          fetch('http://localhost:4000/refreshToken', {         
            method: 'POST',
            headers: {
              'Content-Type': 'application/json;charset=utf-8'
            }, 
            body: JSON.stringify({
              token: localStorage.getItem('token'), 
              refreshToken: localStorage.getItem('refreshToken')
            })
          })
          .then(async res =>{
            if(res.status === 200) {
              const data = await res.json()
              console.log('Получена новая пара токенов', data)

              localStorage.setItem('token', data.newToken)
              localStorage.setItem('refreshToken', data.newRefresh)
              localStorage.setItem('jwtExpire', data.jwtExpire)

              console.log('Все токены обновлены')
            }
          })
      }
    }, (rej)=>{
      console.error('rej', rej.status)
    })
  }

  
  return result
}
export const store = configureStore({
  reducer: {
    user: userSlice.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(checkToken),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
