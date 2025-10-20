import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [apiMessage, setApiMessage] = useState('Loading...')

  useEffect(() => {
    fetch('http://localhost:3001/api/hello')
      .then(res => res.json())
      .then(data => setApiMessage(data.message))
      .catch(() => setApiMessage('API not reachable'))
  }, [])

  return (
    <div className='App'>
      <h1>Hello from Kori Web!</h1>
      <p>API says: {apiMessage}</p>
    </div>
  )
}

export default App
