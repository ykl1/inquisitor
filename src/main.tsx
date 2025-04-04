import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  // development tool that helps you identify potential problems in your 
  // application early. It's a wrapper component that doesn't render any visible 
  // UI but activates additional checks and warnings
  <StrictMode>
    <App />
  </StrictMode>,
)
