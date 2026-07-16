import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { Forfaits } from './pages/Forfaits'
import { About } from './pages/About'
import { Reserver } from './pages/Reserver'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/forfaits" element={<Forfaits />} />
      <Route path="/about" element={<About />} />
  
        <Route path="/reserver" element={<Reserver />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}

export default App
