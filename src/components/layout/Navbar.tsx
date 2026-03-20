import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Users, Scale, LogIn, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!showLogoutModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLogoutModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutModal]);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Scale size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Turnero UJ
            </span>
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
            
            {user && (
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
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-md font-medium text-sm text-blue-600 hover:bg-blue-50 transition-colors ml-4 border border-blue-200"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Ingresar</span>
              </Link>
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

      {showLogoutModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200"
          onClick={() => setShowLogoutModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-5 sm:p-6 max-w-sm w-full transform animate-in scale-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">Cerrar Sesión</h3>
            <p className="text-slate-600 text-xs sm:text-sm mb-5 leading-relaxed">
              ¿Estás seguro de que deseas salir del sistema de gestión?
            </p>

            <div className="flex justify-end gap-2 sm:gap-3 font-medium text-xs sm:text-sm">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setShowLogoutModal(false);
                  signOut();
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
              >
                SÍ, Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
