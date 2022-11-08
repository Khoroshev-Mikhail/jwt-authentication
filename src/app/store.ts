import { configureStore, ThunkAction, Action, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { idText } from 'typescript';

export type User = {
  id: string | number, 
  login: string, 
  token: string | null,
  refreshToken: string | null
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
        localStorage.setItem('id', data.id)
        localStorage.setItem('login', data.login)
        localStorage.setItem('token', data.token)
        localStorage.setItem('refreshToken', data.refreshToken)
      }
      return data
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
      }
      return data
  }
)
const user: User = {
  id: localStorage.getItem('id') || 0, 
  login: localStorage.getItem('login') || 'unknown', 
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null
}
const userSlice = createSlice({
  name: 'userSlice',
  initialState: user,
  reducers: {
    setToken: (state, action) => ({...state, token: action.payload}),
    setRefresh: (state, action) => ({...state, refreshToken: action.payload})
  },
  extraReducers: (builder) => {
    builder.addCase(loginThunk.fulfilled, (_, action) => action.payload)
    builder.addCase(loginThunk.rejected, (_, __) => ({ id: 0, login: 'unknown', token: null, refreshToken: null }))
    builder.addCase(exitThunk.fulfilled, (_, action) => action.payload)
    // builder.addCase(exitThunk.rejected, (_, __) => ({ id: 0, login: 'unknown', token: null, refreshToken: null }))
  }
})
export const { setToken, setRefresh } = userSlice.actions
export const anyThunk = createAsyncThunk(
  'anyThunk',
  async function() {
      const response = await fetch('http://localhost:4000/any', {         
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')} ${localStorage.getItem('refreshToken')}`
          }
      })
      return {ara: 22}
  }
)
const checkToken = (store: any) => (next: any) => (action: any) => {
  if(/pending$/.test(action.type)){
    fetch('http://localhost:4000/checkToken', {         
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        }, 
        body: JSON.stringify({token: localStorage.getItem('token')})
    })
    .then((res) =>{
      if(res.status === 200) {
        console.log('Токен действителен')
      }
      if(res.status === 426){
          console.log('Токен устарел')
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
            console.log('Получена новая пара токенов')
            if(res.status === 200) {
              const data = await res.json()

              localStorage.setItem('token', data.newToken)
              store.dispatch(setToken(data.newToken))
              localStorage.setItem('refreshToken', data.newRefresh)
              store.dispatch(setRefresh(data.newRefresh))

              console.log('Все токены обновлены')
            }
          })
      }
    }, (rej)=>{
      console.error('rej', rej.status)
    })
  }
  const result = next(action)
  console.log('result', result)
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
