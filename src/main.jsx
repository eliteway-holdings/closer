import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Sales from './Sales.jsx'
import AuthGate from './AuthGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate allowedRoles={['executive', 'sales']} title="Closer OS"><Sales /></AuthGate>
  </StrictMode>,
)
