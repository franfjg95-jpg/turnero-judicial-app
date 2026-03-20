import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { TurnosPage } from "./pages/TurnosPage";
import { AgentesPage } from "./pages/AgentesPage";
import { LoginPage } from "./pages/LoginPage";
import { ConfigAccesos } from "./pages/ConfigAccesos";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Clock, Loader2 } from "lucide-react";

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (profile?.estado === 'pendiente') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in duration-300">
        <div className="bg-amber-100 text-amber-600 p-4 rounded-full mb-6 ring-4 ring-amber-50">
          <Clock size={40} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">Acceso Restringido</h2>
        <p className="text-slate-600 max-w-md text-base sm:text-lg leading-relaxed">
          Tu cuenta está siendo revisada por la administración de la UJ. Te avisaremos cuando puedas ver el turnero.
        </p>
      </div>
    );
  }
  
  if (requireAdmin && !profile?.is_admin) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
          <Navbar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><TurnosPage /></ProtectedRoute>} />
              <Route path="/agentes" element={<ProtectedRoute requireAdmin><AgentesPage /></ProtectedRoute>} />
              <Route path="/accesos" element={<ProtectedRoute requireAdmin><ConfigAccesos /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
