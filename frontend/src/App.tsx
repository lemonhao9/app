import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { Forfaits } from './pages/Forfaits'
import { About } from './pages/About'
import { Reserver } from './pages/Reserver'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Profil } from './pages/Profil'
import { MyGarage } from './pages/MyGarage'
import { ClientLayout } from './components/ClientLayout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/forfaits" element={<Forfaits />} />
      <Route path="/about" element={<About />} />
      <Route path="/reserver" element={<Reserver />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ClientLayout />}>
          <Route path="/profil" element={<Profil />} />
          <Route element={<ProtectedRoute roles={['client']} />}>
            <Route path="/my-garage" element={<MyGarage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes >
  )
}

export default App
