import { configureStore, ThunkAction, Action, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query'

const baseQuery = fetchBaseQuery({ baseUrl: 'http://localhost:4000/any',
prepareHeaders: (headers: Headers) => {
  headers.set('Authorization', `Bearer ${localStorage.getItem('token') || 'unknown' } ${localStorage.getItem('refreshToken') || 'unknown'}`)
  return headers
}
 })
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)
  console.log('result', result)
  return result
}

export const anyAPI = createApi({
  reducerPath: 'anyRTK',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['any'],
  endpoints: (builder) => ({
    getAny: builder.query<any, void>({
        query: () =>  `/`,
        providesTags: (result) =>
                result
                ? [
                    ...result.map(({ id }: any) => ({ type: 'any' as const, id })),
                    { type: 'any', id: 'LIST' },
                    ]
                : [{ type: 'any', id: 'LIST' }],
    }),
    setAny: builder.mutation<any, any>({
        query: (body) => ({
          url: ``,
          method: 'POST',
          body
      }),
      invalidatesTags: ['any']
    }),
  })
})
export const {useGetAnyQuery, useSetAnyMutation} = anyAPI
const TOKEN_LIFE_TIME = 1;
const headers = {
  token: localStorage.getItem('token'),
  refresh: localStorage.getItem('refreshToken')
}
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
      return {id, login, status: response.status}
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
  reducers: { },
  extraReducers: (builder) => {
    builder.addCase(loginThunk.fulfilled, (_, action) => action.payload)
    builder.addCase(loginThunk.rejected, (_, __) => {
      localStorage.removeItem('id')
      localStorage.removeItem('login')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('jwtExpire')
      return { id: 0, login: 'unknown' }
    })
    builder.addCase(exitThunk.fulfilled, (_, action) => ({id: 0, login: 'unknown'}))
  }
})
export const anyThunk = createAsyncThunk(
  'anyThunk',
  async function() {
      const response = await fetch('http://localhost:4000/any', {         
          headers: {
              'Authorization': `Bearer ${headers.token} ${headers.refresh}`
          }
      })
      return response.status
  }
)
// const checkToken = (store: any) => (next: any) => async (action: any) => {
//   //Проблема в том: в статусе пендинг приходят новые токены. Далее уже вызывается другой слой с акшен/фулфиелд но запрос
//   // был отправлен со старым токеном который был перед статусом пендинг
//   console.log('----------------------------начало мд', action.type, action.statusCode)
//   console.log(localStorage.getItem('token'))
//   if(action.type.includes('pending') && store.getState().user.id > 0 && localStorage.getItem('jwtExpire') && new Date().getMinutes() - new Date(localStorage.getItem('jwtExpire') || new Date()).getMinutes() >= TOKEN_LIFE_TIME){
//     console.log('Запрашиваю новый токен:')
//     const refresh = await fetch('http://localhost:4000/refreshToken', {         
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json;charset=utf-8'
//       }, 
//       body: JSON.stringify({
//         token: localStorage.getItem('token'), 
//         refreshToken: localStorage.getItem('refreshToken')
//       })
//     })
//     if(refresh.status !== 426){
//       const data = await refresh.json()   
//       localStorage.setItem('token', data.newToken)
//       headers.token = data.newToken
//       localStorage.setItem('refreshToken', data.newRefresh)
//       headers.refresh = data.newRefresh
//       localStorage.setItem('jwtExpire', data.jwtExpire)
//       console.log('Токены получены')
//       return store.dispatch(action) //Здесь надо именно заного запустить диспатч с этим эе акшеном, иначе выполнится старый запрос, а он судя по всему захватывает хедеры
//       }
//     }
//   const result = next(action)
//   console.log(localStorage.getItem('token'))
//   console.log('----------------------------конец мд', result)
//   return result
// }
export const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    [anyAPI.reducerPath] : anyAPI.reducer
  },
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(checkToken),
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(anyAPI.middleware)
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
