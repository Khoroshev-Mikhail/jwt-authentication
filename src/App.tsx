import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [connection, setConnection] = useState()
  async function checkConnect() {
    const response = await fetch('http://localhost:4000/')
    const data = await response.json()
    setConnection(data)
  }
  useEffect(()=>{
    checkConnect()
  }, [])
  return (
    <div className="App">
      {connection}
    </div>
  );
}

export default App;
