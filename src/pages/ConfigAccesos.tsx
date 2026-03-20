import { useEffect, useState } from "react";
import { api } from "../api/supabase";
import type { Profile } from "../types";
import { Loader2, CheckCircle, Clock } from "lucide-react";

export function ConfigAccesos() {
  const [pendings, setPendings] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState<string | null>(null);

  useEffect(() => {
    loadPendings();
  }, []);

  const loadPendings = async () => {
    setLoading(true);
    try {
      const data = await api.auth.getPendingProfiles();
      setPendings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (id: string) => {
    try {
      setAuthorizing(id);
      await api.auth.authorizeProfile(id);
      await loadPendings();
    } catch (err) {
      console.error("Error al autorizar", err);
    } finally {
      setAuthorizing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Autorizar Accesos
          </h1>
          <p className="text-slate-500 mt-1">Revisa y aprueba a los nuevos sumariantes registrados.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12 text-slate-400">
            <Loader2 className="animate-spin mr-2" /> Cargando solicitudes...
          </div>
        ) : pendings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="bg-green-50 text-green-600 p-4 rounded-full mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Todo al día</h3>
            <p className="text-slate-500 text-sm mt-1">No hay usuarios pendientes de autorización.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 text-sm font-semibold text-left">
              <tr>
                <th className="px-6 py-4">Usuario (Correo)</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendings.map((prof) => (
                <tr key={prof.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{prof.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                      <Clock size={12} /> Pendiente
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleAuthorize(prof.id)}
                      disabled={authorizing === prof.id}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm disabled:opacity-50"
                    >
                      {authorizing === prof.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      Autorizar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
