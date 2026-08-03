import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Loader2, Lock, Eye, EyeOff, LogIn, Users } from "lucide-react";

export function LoginPage() {
  const { loginAsWorker } = useAuth();
  const [activeTab, setActiveTab] = useState<"admin" | "worker">("admin");
  const [isAdminRegister, setIsAdminRegister] = useState(false); // Toggle entre Login y Registro de Admin
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");

  const [workerUsername, setWorkerUsername] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      navigate("/");
    } catch (err: any) {
      setError("Credenciales incorrectas o error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (!workerUsername.trim() || !workerPassword.trim()) {
        throw new Error("Por favor completa todos los campos.");
      }
      await loginAsWorker(workerUsername.trim(), workerPassword.trim());
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre,
            is_admin: true,
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        setSuccessMsg("¡Registro exitoso! Ya puedes iniciar sesión con tu cuenta de Administrador.");
        setIsAdminRegister(false); // Cambiar a login
        setNombre("");
        setPassword("");
      }
    } catch (err: any) {
      setError(err.message || "Error al registrar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50/50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 p-8 w-full max-w-md">
        
        {/* Selector de Pestañas (Admin / Usuario) */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 font-semibold text-xs xl:text-sm">
          <button
            onClick={() => { setActiveTab("admin"); setIsAdminRegister(false); setError(""); setSuccessMsg(""); }}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "admin" ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
          >
            <LogIn size={15} />
            Admin
          </button>
          <button
            onClick={() => { setActiveTab("worker"); setError(""); setSuccessMsg(""); }}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === "worker" ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500 hover:text-slate-850'}`}
          >
            <Users size={15} />
            Usuario
          </button>
        </div>

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-3.5 rounded-2xl text-white mb-4 shadow-lg shadow-blue-500/20">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {activeTab === "worker" 
              ? "Acceso Usuario" 
              : isAdminRegister 
              ? "Nuevo Administrador" 
              : "Acceso Administrador"}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            {activeTab === "worker"
              ? "Ingresa con el usuario y clave de acceso compartidos"
              : isAdminRegister
              ? "Regístrate para crear y configurar tu propio turnero"
              : "Ingresa con tu correo de administrador"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-750 p-3.5 rounded-xl text-sm mb-5 border border-red-200/60 animate-in fade-in duration-200 font-semibold font-sans">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-750 p-3.5 rounded-xl text-sm mb-5 border border-emerald-250/60 animate-in fade-in duration-200 font-semibold font-sans">
            {successMsg}
          </div>
        )}

        {/* Formulario Administrador (Ingreso o Registro) */}
        {activeTab === "admin" && (
          <form onSubmit={isAdminRegister ? handleAdminRegister : handleAdminLogin} className="space-y-4">
            
            {isAdminRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5">Nombre de la Unidad Judicial / Completo</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ej: Unidad Judicial 15"
                  required={isAdminRegister}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5">Correo de Administrador</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@unidadjudicial.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-2.5 pr-12 bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Enlace para cambiar entre Login y Registro */}
            <div className="text-right px-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsAdminRegister(!isAdminRegister);
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors outline-none"
              >
                {isAdminRegister ? "¿Ya tienes un turnero? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex justify-center items-center mt-3 shadow-md shadow-blue-500/10 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isAdminRegister ? "Crear Cuenta" : "Ingresar")}
            </button>
          </form>
        )}

        {/* Formulario Trabajadores Ingreso (Usuario) */}
        {activeTab === "worker" && (
          <form onSubmit={handleWorkerLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5">Usuario de acceso</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                value={workerUsername}
                onChange={(e) => setWorkerUsername(e.target.value)}
                placeholder="ej: sumariantes_uj"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 ml-0.5">Clave de acceso</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-2.5 pr-12 bg-slate-50/70 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                  value={workerPassword}
                  onChange={(e) => setWorkerPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex justify-center items-center mt-3 shadow-md shadow-blue-500/10 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Ingresar"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
