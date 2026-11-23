import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { CompanyProvider } from './context/CompanyContext'
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CompanyProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  </StrictMode>,
)
