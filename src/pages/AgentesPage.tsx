import { useEffect, useState } from "react";
import { Trash2, Edit2, Loader2 } from "lucide-react";
import { api } from "../api/supabase";
import type { Agent } from "../types";

export function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ nombre: "", puesto: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await api.agents.getAll();
      setAgents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.puesto.trim()) return;

    try {
      setLoading(true);
      if (editingId) {
        await api.agents.update(editingId, form);
      } else {
        await api.agents.create(form);
      }
      setForm({ nombre: "", puesto: "" });
      setEditingId(null);
      await loadAgents();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEdit = (agent: Agent) => {
    setForm({ nombre: agent.nombre, puesto: agent.puesto });
    setEditingId(agent.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este agente?")) return;
    try {
      setLoading(true);
      await api.agents.delete(id);
      await loadAgents();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Personal / Agentes
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
            {editingId ? "Editar Agente" : "Nuevo Agente"}
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Puesto / Cargo</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.puesto}
                onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                placeholder="Ej. Oficial"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex justify-center items-center"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (editingId ? "Guardar Cambios" : "Agregar")}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setForm({nombre: "", puesto: ""}) }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabla / Lista */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading && agents.length === 0 ? (
            <div className="flex justify-center items-center p-12 text-slate-400">
              <Loader2 className="animate-spin mr-2" /> Cargando personal...
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 text-sm font-semibold text-left">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Puesto</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      No hay agentes registrados.
                    </td>
                  </tr>
                ) : (
                  agents.map((ag) => (
                    <tr key={ag.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{ag.nombre}</td>
                      <td className="px-6 py-4 text-slate-600">{ag.puesto}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(ag)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-block mr-2"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ag.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors inline-block"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
