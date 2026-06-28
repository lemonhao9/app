import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">HomeCycl Home</h1><p className="text-muted-foreground mt-2">Bienvenue</p></div>} />
    </Routes>
  )
}

export default App
