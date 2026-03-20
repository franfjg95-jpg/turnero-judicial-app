import { Link, useLocation } from "react-router-dom";
import { Calendar, Users, Scale, LogIn, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

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
                onClick={signOut}
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
  );
}
