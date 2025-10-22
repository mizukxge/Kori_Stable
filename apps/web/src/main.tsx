import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Set initial locale attributes
document.documentElement.lang = localStorage.getItem('kori-language') || 'en-GB';
document.documentElement.dir = 'ltr';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)