import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2, Lock, UserPlus, Eye, EyeOff } from "lucide-react";

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        navigate("/");
      } else {
        const { data, error: registerError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (registerError) throw registerError;
        
        if (data.user) {
          const { error: profileError } = await supabase.from('perfiles').insert({
            id: data.user.id,
            email: email,
            nombre: nombre || 'Sumariante',
            estado: 'pendiente',
            is_admin: false
          });
          if (profileError) throw profileError;
        }

        setSuccess("Registro exitoso. Acceso pendiente de aprobación.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      if (isLogin) {
        setError("Credenciales incorrectas o error de conexión.");
      } else {
        setError(err.message || "Error al registrar la cuenta.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 filter backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-4 ring-4 ring-blue-50">
            {isLogin ? <Lock size={28} /> : <UserPlus size={28} />}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isLogin ? "Acceso al Sistema" : "Registro de Sumariante"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLogin ? "Ingresa para ver tu calendario" : "Solicita acceso a la Unidad Judicial"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200 animate-in fade-in">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm mb-4 border border-green-200 animate-in fade-in">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="animate-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required={!isLogin}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@unidadjudicial.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2 pr-12 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "Ocultar Contraseña" : "Ver Contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center mt-2 shadow-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? "Ingresar" : "Registrarse")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
              setNombre("");
              setPassword("");
            }}
            className="text-blue-600 font-semibold hover:underline"
            type="button"
          >
            {isLogin ? "Regístrate aquí" : "Inicia sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
