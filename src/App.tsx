import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './App.css';
import { RootState } from './app/store';
import Auth from './Components/Auth';

function App() {
  const user = useSelector((state: RootState) => state.user)
  const [connection, setConnection] = useState<string | boolean>(false)
  const [auth, setAuth] = useState<boolean>(false)
  const [users, setUsers] = useState([])
  async function checkConnect() {
    const response = await fetch('http://localhost:4000/')
    const data = await response.json()
    setConnection(data)
  }
  async function getUsers() {
    const response = await fetch('http://localhost:4000/users')
    const data = await response.json()
    setUsers(data)
  }
  async function authorization() {
    const response = await fetch('http://localhost:4000/checkAuth')
    setAuth(response.ok)
  }
  useEffect(()=>{
    checkConnect()
    getUsers()
    authorization()
  }, [])
  return (
    <div className="App">
      <h1 className={`${auth ? 'bg-green-100' : 'bg-red-100'} w-full sm:w-96 mx-auto my-4 p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700`}>
        {`Id: ${user.id}, Login: ${user.login}, Token: ${user.token}`}
        </h1>
      <Auth />
      <div className={`w-full sm:w-96 mx-auto my-4 p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${connection ? 'bg-green-100' : 'bg-red-100'}`}>
        {users.map((el: any, i: number) => {
          return (
            <div key={i}>
              <h1>{connection}</h1>
              <h1>Список пользователей в бд:</h1>
              {`Id: ${el.id}, Login: ${el.user_login}, Pwd: ${el.user_password}, Token: ${el.token}`}
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default App;
