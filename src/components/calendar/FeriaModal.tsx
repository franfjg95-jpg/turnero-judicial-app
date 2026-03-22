import { useState } from "react";
import { X, Palmtree, Trash2, Calendar, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Agent, Feria } from "../../types";

interface Props {
  agents: Agent[];
  ferias: Feria[];
  onClose: () => void;
  onAssign: (agenteId: string, fechaInicio: string, fechaFin: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function FeriaModal({ agents, ferias, onClose, onAssign, onDelete }: Props) {
  const [agenteId, setAgenteId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agenteId || !fechaInicio || !fechaFin) return;
    
    setLoading(true);
    try {
      await onAssign(agenteId, fechaInicio, fechaFin);
      setAgenteId("");
      setFechaInicio("");
      setFechaFin("");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white">
          <div className="flex items-center gap-3">
            <div className="bg-sky-100 p-2 rounded-xl text-sky-600">
              <Palmtree size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Feria y Vacaciones</h2>
              <p className="text-xs text-slate-500">Gestionar licencias de sumariantes</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          
          {/* Fomulario */}
          <div className="p-4 sm:p-5 lg:w-1/3 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-700">Asignar Feria</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Sumariante</label>
                <select 
                  value={agenteId}
                  onChange={(e) => setAgenteId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-white"
                  required
                >
                  <option value="" disabled>Seleccione...</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Fecha Inicio</label>
                <input 
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Fecha Fin</label>
                <input 
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  min={fechaInicio}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Palmtree size={16} />}
                Guardar Feria
              </button>
            </form>
          </div>

          {/* Lista actual */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col min-h-0 bg-white">
             <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
               <Calendar size={16} className="text-slate-400" />
               Ferias Registradas
             </h3>
             <div className="flex-1 overflow-y-auto pr-1">
               {ferias.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 my-8 lg:my-0">
                    <Palmtree size={32} className="opacity-20" />
                    <p className="text-sm">No hay ferias registradas</p>
                 </div>
               ) : (
                 <div className="flex flex-col gap-2">
                    {ferias.map(f => {
                      const nombre = f.agentes?.nombre || agents.find(a => a.id === f.agente_id)?.nombre || "Desconocido";
                      return (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/50 hover:bg-sky-50 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">{nombre}</span>
                            <span className="text-xs font-semibold text-sky-600 mt-0.5">
                              {format(parseISO(f.fecha_inicio), "dd MMM yyyy", { locale: es })} - {format(parseISO(f.fecha_fin), "dd MMM yyyy", { locale: es })}
                            </span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => f.id && handleDelete(f.id)}
                            disabled={deletingId === f.id}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                            title="Eliminar feria"
                          >
                            {deletingId === f.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      )
                    })}
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
