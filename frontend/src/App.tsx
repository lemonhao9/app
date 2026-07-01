import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { Forfaits } from './pages/Forfaits'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/forfaits" element={<Forfaits />} />
    </Routes>
  )
}

export default App
