import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { TurnosPage } from "./pages/TurnosPage";
import { AgentesPage } from "./pages/AgentesPage";
import { LoginPage } from "./pages/LoginPage";
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
  
  // Admins whitelisted — si el perfil aún no cargó, mostrar spinner (no "Denegado")
  const ADMIN_EMAILS = ['franfjg95@gmail.com', 'toledomariajulieta.mpf@gmail.com'];
  const isWhitelisted = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim());

  if (!profile) {
    if (isWhitelisted) {
      // El bypass del AuthContext todavía no terminó, mostrar spinner suave
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 animate-in fade-in duration-300">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="text-sm text-slate-500">Cargando sesión...</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in duration-300">
        <div className="bg-red-100 text-red-600 p-4 rounded-full mb-6 ring-4 ring-red-50">
          <Clock size={40} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">Acceso Denegado</h2>
        <p className="text-slate-600 max-w-md text-base sm:text-lg leading-relaxed">
          Tu cuenta ha sido rechazada o eliminada del sistema. No tienes acceso a la Unidad Judicial.
        </p>
        <p className="text-xs text-slate-400 mt-4 font-mono bg-slate-100 px-3 py-1.5 rounded">
          Debug: email={user?.email || 'null'} | uid={user?.id?.slice(0,8) || 'null'}
        </p>
      </div>
    );
  }

  if (profile.estado === 'pendiente') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in duration-300">
        <div className="bg-amber-100 text-amber-600 p-4 rounded-full mb-6 ring-4 ring-amber-50">
          <Clock size={40} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">Acceso Restringido</h2>
        <p className="text-slate-600 max-w-md text-base sm:text-lg leading-relaxed">
          Acceso pendiente de aprobación.
        </p>
      </div>
    );
  }
  
  if (requireAdmin) {
     const isAppAdmin = profile.is_admin === true;
     if (!isAppAdmin) return <Navigate to="/" replace />;
  }
  
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
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
