import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Desk from './Desk.jsx'
import AuthGate from './AuthGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthGate allowedRoles={['executive', 'marketing']} title="Marketing OS"><Desk /></AuthGate>
  </StrictMode>,
)
