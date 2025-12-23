import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PacientesProvider } from './context/PacientesContext';
import { ConsultasProvider } from './context/ConsultasContext';
import { TurnosProvider } from './context/TurnosContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import Pacientes from './pages/Pacientes';
import PacienteForm from './components/pacientes/PacienteForm';
import PacienteDetalle from './components/pacientes/PacienteDetalle';
import Consultas from './pages/Consultas';
import ConsultaForm from './components/consultas/ConsultaForm';
import ConsultaDetalle from './components/consultas/ConsultaDetalle';
import Turnos from './pages/Turnos';
import TurnoForm from './components/turnos/TurnoForm';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PacientesProvider>
          <ConsultasProvider>
            <TurnosProvider>
              <Routes>
                {/* Ruta pública de Login */}
                <Route path="/login" element={<Login />} />
                
                {/* Rutas protegidas */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <div className="min-vh-100 bg-light">
                        <Navbar />
                        <Routes>
                          <Route path="/" element={<Home />} />
                          
                          {/* Rutas de Pacientes */}
                          <Route path="/pacientes" element={<Pacientes />} />
                          <Route path="/pacientes/nuevo" element={<PacienteForm />} />
                          <Route path="/pacientes/:id" element={<PacienteDetalle />} />
                          <Route path="/pacientes/:id/editar" element={<PacienteForm />} />
                          
                          {/* Rutas de Consultas */}
                          <Route path="/consultas" element={<Consultas />} />
                          <Route path="/consultas/nueva" element={<ConsultaForm />} />
                          <Route path="/consultas/:id" element={<ConsultaDetalle />} />
                          <Route path="/consultas/:id/editar" element={<ConsultaForm />} />
                          
                          {/* Rutas de Turnos */}
                          <Route path="/turnos" element={<Turnos />} />
                          <Route path="/turnos/nuevo" element={<TurnoForm />} />
                          <Route path="/turnos/:id/editar" element={<TurnoForm />} />
                          
                          {/* Ruta por defecto */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </TurnosProvider>
          </ConsultasProvider>
        </PacientesProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
