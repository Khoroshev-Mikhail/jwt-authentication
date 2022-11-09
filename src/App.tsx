import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './App.css';
import { useAppDispatch } from './app/hooks';
import { anyThunk, RootState } from './app/store';
import Auth from './Components/Auth';

function App() {
  const user = useSelector((state: RootState) => state.user)
  const dispatch = useAppDispatch()
  const [connection, setConnection] = useState<string | boolean>(false)
  const [auth, setAuth] = useState<boolean>(false)
  const [users, setUsers] = useState([])

  //Здесь добавить проверку на ошибки
  let bearer = `unknown unknown`
  if(localStorage.getItem('token') && localStorage.getItem('refreshToken')){
    bearer = `${localStorage.getItem('token') || 'unknown' } ${localStorage.getItem('refreshToken') || 'unknown'}`
  }

  async function checkConnect() {
    const response = await fetch('http://localhost:4000/', {
      headers: {'Authorization': `Bearer ${bearer}`}
    })
    setConnection(response.ok)
  }
  async function getUsers() {
    const response = await fetch('http://localhost:4000/users', {
      headers: {'Authorization': `Bearer ${bearer}`}
    })
    const data = await response.json()
    setUsers(data)
  }
  async function authorization() {
    const response = await fetch('http://localhost:4000/checkAuth', {
      headers: {'Authorization': `Bearer ${bearer}`}
    })
    setAuth(response.ok)
  }
  useEffect(()=>{
    checkConnect()
    getUsers()
    authorization()
  }, [])
  useEffect(()=>{
    authorization()
    getUsers()
    checkConnect()
  }, [localStorage.getItem('token')])
  return (
    <div className="App">
      <Auth />
      <div className={`w-full sm:w-96 mx-auto my-4 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${user.id ? 'bg-green-100' : 'bg-red-100'}`}>
        <h1>Store:</h1>
        <button onClick={()=>{dispatch(anyThunk())}}>Any</button>
        <h1>{`Id: ${user.id}, Login: ${user.login}, Token: ${localStorage.getItem('token') ? 'TRUE' : 'NULL'}, REFRESH: ${localStorage.getItem('refreshToken') ? 'TRUE' : 'NULL'}`}</h1>
      </div>
      <div className={`w-full sm:w-96 mx-auto my-4 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${connection ? 'bg-green-100' : 'bg-red-100'}`}>
        {users.map((el: any, i: number) => {
          return (
            <div key={i}>
              <h1>{connection && 'Connection is good'}</h1>
              <h1>Список пользователей в бд:</h1>
              {`Id: ${el.id}, Login: ${el.user_login}, Pwd: ${el.user_password}, Token: ${el.token ? 'TRUE' : 'NULL'}, refreshToken: ${el.refresh_token ? 'TRUE' : 'NULL'}`}
            </div>
          )
        })}
      </div>
      <div className={`w-full sm:w-96 mx-auto my-4 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${auth ? 'bg-green-100' : 'bg-red-100'}`}>
            <div>
              <h1>Auth на сервере req.user</h1>
            </div>
      </div>
    </div>
  );
}

export default App;
