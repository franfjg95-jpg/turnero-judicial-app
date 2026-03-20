import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Users, Scale, LogIn, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const isAdmin = user?.email === 'toledomariajulieta.mpf@gmail.com';

  useEffect(() => {
    if (!showLogoutModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLogoutModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogoutModal]);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Scale size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent hidden sm:block">
                  Turnero UJ
                </h1>
                <h1 className="text-xl font-bold text-slate-900 sm:hidden">
                  Turnero
                </h1>
              </div>
            </div>

            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors",
                  location.pathname === "/"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Calendar size={18} />
                <span className="hidden sm:inline">Turnos</span>
              </Link>
              
              {isAdmin && (
                <Link
                  to="/agentes"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm transition-colors",
                    location.pathname === "/agentes"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Users size={18} />
                  <span className="hidden sm:inline">Personal</span>
                </Link>
              )}

              {!user ? (
                location.pathname !== "/login" && (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm text-blue-600 hover:bg-blue-50 transition-colors ml-4 border border-blue-200"
                  >
                    <LogIn size={18} />
                    <span className="hidden sm:inline">Acceso Admin</span>
                  </Link>
                )
              ) : (
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors ml-4 border border-transparent hover:border-red-200"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Modal Confirmación Salida */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Cerrar Sesión
              </h3>
              <p className="text-slate-600 text-sm">
                ¿Estás seguro de que deseas salir del sistema de gestión?
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors flex-1 bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-red-700 transition-colors bg-red-600 flex-1"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
