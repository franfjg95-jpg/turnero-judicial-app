import { useEffect, useState } from "react";
import { api } from "../api/supabase";
import type { Profile } from "../types";
import { Loader2, CheckCircle, Clock, UserPlus, Mail } from "lucide-react";

export function ConfigAccesos() {
  const [pendings, setPendings] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      await api.auth.inviteUser(inviteEmail, inviteName);
      setInviteSuccess(`Sumariante ${inviteName} insertado con éxito.`);
      setInviteEmail("");
      setInviteName("");
      await loadPendings();
    } catch (err: any) {
      setInviteError(err.message || "Error al invitar sumariante.");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Control de Accesos
          </h1>
          <p className="text-slate-500 mt-1">Alta estricta de sumariantes y panel de autorizaciones.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 flex items-center gap-2">
            <UserPlus size={18} className="text-blue-600" /> Invitar Sumariante
          </div>
          <form onSubmit={handleInvite} className="p-4 space-y-4">
            {inviteError && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{inviteError}</div>}
            {inviteSuccess && <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">{inviteSuccess}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="nuevo@unidadjudicial.com"
                required
              />
            </div>
            <div className="bg-slate-50 p-2.5 rounded-md border border-slate-200 text-xs text-slate-600 flex items-center gap-2 leading-relaxed">
              <Mail size={14} className="shrink-0 text-slate-400" />
              <span>Esta acción guardará al usuario bajo la clave temporal estricta <strong className="text-slate-800 font-mono">UJ123456</strong> y estado aprobado.</span>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors flex justify-center items-center text-sm shadow-sm mt-2"
            >
              {inviting ? <Loader2 className="animate-spin" size={16} /> : "Crear y Autorizar"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" /> Solicitudes Antiguas o Pendientes
          </div>
          {loading ? (
            <div className="flex justify-center items-center p-12 text-slate-400">
              <Loader2 className="animate-spin mr-2" /> Cargando solicitudes...
            </div>
          ) : pendings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="bg-green-50 text-green-600 p-3 rounded-full mb-3 ring-4 ring-green-50/50">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Panel limpio</h3>
              <p className="text-slate-500 text-sm mt-1">No hay usuarios rezagados ni pendientes en la cola.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold text-left">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pendings.map((prof) => (
                    <tr key={prof.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800 text-sm">{prof.nombre || 'Sin nombre'}</td>
                      <td className="px-4 py-3 font-medium text-slate-600 text-sm">{prof.email}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleAuthorize(prof.id)}
                          disabled={authorizing === prof.id}
                          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors text-xs disabled:opacity-50"
                        >
                          {authorizing === prof.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          Autorizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
