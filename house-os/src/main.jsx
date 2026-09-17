import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import House from './House.jsx'
import AuthGate from './AuthGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate allowedRoles={['executive']} title="House OS"><House /></AuthGate>
  </StrictMode>,
)
