import { useEffect, useState } from "react";
import { api } from "../api/supabase";
import type { Profile } from "../types";
import { Loader2, CheckCircle, Clock, Trash2 } from "lucide-react";

export function ConfigAccesos() {
  const [pendings, setPendings] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleReject = async (id: string) => {
    if (!confirm("¿Estás segura de que deseas rechazar y eliminar a este usuario de la lista?")) return;
    try {
      setDeleting(id);
      await api.auth.deleteProfile(id);
      await loadPendings();
    } catch (err) {
      console.error("Error al rechazar", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Control de Accesos
          </h1>
          <p className="text-slate-500 mt-1">Autoriza o rechaza solicitudes de nuevos sumariantes.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 flex items-center gap-2">
          <Clock size={18} className="text-amber-500" /> Solicitudes Pendientes
        </div>
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold text-left">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Usuario (Correo)</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendings.map((prof) => (
                  <tr key={prof.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{prof.nombre || 'Sin nombre'}</td>
                    <td className="px-6 py-4 font-medium text-slate-600 text-sm">{prof.email}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleReject(prof.id)}
                          disabled={deleting === prof.id || authorizing === prof.id}
                          className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md font-medium transition-colors text-xs disabled:opacity-50 border border-red-200"
                        >
                          {deleting === prof.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleAuthorize(prof.id)}
                          disabled={authorizing === prof.id || deleting === prof.id}
                          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors text-xs disabled:opacity-50"
                        >
                          {authorizing === prof.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          Autorizar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
