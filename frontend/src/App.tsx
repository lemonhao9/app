import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicLayout } from './components/PublicLayout'
import { LandingPage } from './pages/LandingPage'
import { Forfaits } from './pages/Forfaits'
import { About } from './pages/About'
import { Reserver } from './pages/Reserver'
import { MentionsLegales } from './pages/MentionsLegales'
import { CGV } from './pages/CGV'
import { Confidentialite } from './pages/Confidentialite'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Profil } from './pages/Profil'
import { MyGarage } from './pages/MyGarage'
import { ClientLayout } from './components/ClientLayout'
import { AdminLayout } from './components/AdminLayout'
import { AdminZones } from './pages/AdminZones'
import { Historique } from './pages/Historique'
import { TechnicianLayout } from './components/TechnicianLayout';
import { TechnicianProfil } from './pages/TechnicianProfil'
import { AgendaJour } from './pages/AgendaJour'
import { InterventionDetail } from './pages/InterventionDetail'
import { HistoriqueTechnicien } from './pages/HistoriqueTechnicien'
import { AdminInterventionDetail } from './pages/AdminInterventionDetail'
import { AdminInterventions } from './pages/AdminInterventions'
import { AdminForfaits } from './pages/AdminForfaits'
import { AdminProduits } from './pages/AdminProduits'
import { AdminTechniciens } from './pages/AdminTechniciens'
import { ChangerMotDePasse } from './pages/ChangerMotDePasse'
import { AdminUtilisateurs } from './pages/AdminUtilisateurs'
import { AdminClients } from './pages/AdminClients'

const AdminPlanning = lazy(() => import('./pages/AdminPlanning').then(m => ({ default: m.AdminPlanning })))

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/forfaits" element={<Forfaits />} />
        <Route path="/about" element={<About />} />
        <Route path="/reserver" element={<Reserver />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/cgv" element={<CGV />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/zones" element={<AdminZones />} />
            <Route path="/admin/interventions/:id" element={<AdminInterventionDetail />} />
            <Route path="/admin/interventions" element={<AdminInterventions />} />
            <Route path="/admin/forfaits" element={<AdminForfaits />} />
            <Route path="/admin/produits" element={<AdminProduits />} />
            <Route path="/admin/techniciens" element={<AdminTechniciens />} />
            <Route path="/admin/utilisateurs" element={<AdminUtilisateurs />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/planning" element={<Suspense fallback={<p className="text-sm text-gray-600">Chargement du planning...</p>}><AdminPlanning /></Suspense>} />
          </Route>
        </Route>
        <Route element={<ClientLayout />}>
          <Route path="/profil" element={<Profil />} />
          <Route element={<ProtectedRoute roles={['client']} />}>
            <Route path="/my-garage" element={<MyGarage />} />
            <Route path="/historique" element={<Historique />} />
          </Route>
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/changer-mot-de-passe" element={<ChangerMotDePasse />} />
      <Route element={<ProtectedRoute roles={['technician']} />}>
        <Route element={<TechnicianLayout />}>
          <Route path="/technician/agenda" element={<AgendaJour />} />
          <Route path="/technician/profil" element={<TechnicianProfil />} />
          <Route path="/technician/historique" element={<HistoriqueTechnicien />} />
          <Route path="/technician/intervention/:id" element={<InterventionDetail />} />
        </Route>
      </Route>

    </Routes >
  )
}

export default App
