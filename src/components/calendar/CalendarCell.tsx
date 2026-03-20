import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Loader2 } from "lucide-react";
import { type ShiftType, type Agent, type Shift } from "../../types";

interface Props {
  date: Date;
  agents: Agent[];
  shifts: Shift[];
  onAssignShift: (date: Date, type: ShiftType, agentId: string) => Promise<void>;
  onUpdateHorario: (date: Date, type: ShiftType, horario: string) => void;
  isToday: boolean;
  isWeekend: boolean;
  isAdmin: boolean;
}

export function CalendarCell({
  date,
  agents,
  shifts,
  onAssignShift,
  onUpdateHorario,
  isToday,
  isWeekend,
  isAdmin,
}: Props) {
  const [editingBlock, setEditingBlock] = useState<ShiftType | null>(null);
  const [localTimes, setLocalTimes] = useState<{ [key: string]: string }>({});
  const [loadingBlock, setLoadingBlock] = useState<ShiftType | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    blockLabel: ShiftType;
    newAgentId: string;
    newAgentName: string;
  } | null>(null);

  useEffect(() => {
    if (!confirmModal?.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmModal(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmModal]);

  const dateStr = format(date, "yyyy-MM-dd");
  const dayShifts = shifts.filter((s) => s.fecha === dateStr);

  const handleBlur = (blockLabel: ShiftType, assignedAgent: string | undefined, value: string) => {
    if (!assignedAgent && value.trim() !== "") {
      const newLocalTimes = { ...localTimes };
      delete newLocalTimes[blockLabel];
      setLocalTimes(newLocalTimes);
      setEditingBlock(null);
      return;
    }
    if (assignedAgent) {
      onUpdateHorario(date, blockLabel, value);
    }
    setEditingBlock(null);
  };

  const handleAssign = async (blockLabel: ShiftType, newAgentId: string) => {
    const assigned = dayShifts.find((s) => s.tipo_turno === blockLabel);
    
    // Ignorar si elige el mismo
    if (assigned?.agente_id === newAgentId) return;

    // Confirmar si ya hay alguien y lo va a cambiar/quitar
    if (assigned && assigned.agente_id) {
       const newAgentName = newAgentId ? agents.find(a => a.id === newAgentId)?.nombre : "Libre (Sin asignar)";
       setConfirmModal({
         isOpen: true,
         blockLabel,
         newAgentId,
         newAgentName: newAgentName || ""
       });
       return;
    }

    await executeAssign(blockLabel, newAgentId);
  };

  const executeAssign = async (blockLabel: ShiftType, newAgentId: string) => {
    setLoadingBlock(blockLabel);
    try {
      await onAssignShift(date, blockLabel, newAgentId);
      setEditingBlock(null);
    } finally {
      setLoadingBlock(null);
      setConfirmModal(null);
    }
  };

  const renderBlock = (blockLabel: ShiftType) => {
    const assigned = dayShifts.find((s) => s.tipo_turno === blockLabel);
    const isEditing = editingBlock === blockLabel;
    const assignedAgentName = assigned ? agents.find(a => a.id === assigned.agente_id)?.nombre : null;
    const isSaving = loadingBlock === blockLabel;

    return (
      <div
        key={blockLabel}
        className={`flex flex-col gap-1 xl:gap-1.5 p-1.5 xl:p-2 rounded-md border ${
          blockLabel === "Franco Compensatorio"
            ? "bg-red-50 border-red-300"
            : blockLabel === "Trasnoche"
            ? "bg-blue-50 border-blue-300"
            : "bg-white border-slate-300"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span
            className={`font-bold text-[9px] xl:text-[11px] uppercase tracking-tight leading-none flex items-center gap-1 ${
              blockLabel === "Franco Compensatorio"
                ? "text-red-700"
                : blockLabel === "Trasnoche"
                ? "text-blue-700"
                : "text-slate-700"
            }`}
          >
            <span className="truncate max-w-[55px] xl:max-w-max">{blockLabel}</span>
            {isSaving && <Loader2 size={10} className="animate-spin text-blue-500 shrink-0" />}
          </span>
          {isAdmin && (
            <button
              onClick={() => setEditingBlock(isEditing ? null : blockLabel)}
              className="text-slate-400 hover:text-blue-600 p-0.5 xl:p-1 rounded-md hover:bg-slate-100"
              title="Editar horario..."
            >
              <Clock size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="w-full flex flex-col gap-1 xl:gap-1.5">
          {isAdmin ? (
            <select
              disabled={isSaving}
              className={`text-[10px] xl:text-xs font-medium bg-white border border-slate-200 rounded p-1 xl:p-1.5 outline-none text-slate-800 ${isSaving ? 'opacity-50 cursor-wait' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer hover:border-slate-300'}`}
              value={assigned?.agente_id || ""}
              onChange={(e) => handleAssign(blockLabel, e.target.value)}
            >
              <option value="">- Sin asignar -</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.nombre}
                </option>
              ))}
            </select>
          ) : (
            <div className={`text-[10px] xl:text-xs font-semibold px-0.5 xl:px-1 py-0.5 truncate ${assignedAgentName ? "text-slate-800" : "text-slate-400"}`}>
              {assignedAgentName || "- Libre -"}
            </div>
          )}

          {isEditing && isAdmin ? (
            <input
              type="text"
              placeholder="Ej. 07 a 14hs"
              className="text-[10px] xl:text-[11px] w-full border-b-2 border-blue-400 bg-slate-50 shadow-inner rounded-t-sm outline-none px-1 xl:px-1.5 py-0.5 xl:py-1 text-blue-800 placeholder:text-blue-300 focus:border-blue-600"
              value={localTimes[blockLabel] ?? (assigned?.horario_personalizado || "")}
              onChange={(e) =>
                setLocalTimes({ ...localTimes, [blockLabel]: e.target.value })
              }
              onBlur={(e) => handleBlur(blockLabel, assigned?.agente_id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingBlock(null);
              }}
              autoFocus
            />
          ) : (
            assigned?.horario_personalizado && (
              <span 
                className={`text-[9px] xl:text-[11px] font-medium text-slate-500 flex items-center gap-1 px-0.5 xl:px-1 pb-0.5 ${isAdmin ? "cursor-pointer hover:text-blue-600" : ""}`}
                onClick={() => isAdmin && setEditingBlock(blockLabel)}
                title={isAdmin ? "Clic para editar" : ""}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50 shrink-0"></div>
                <span className="truncate">{assigned.horario_personalizado}</span>
              </span>
            )
          )}
        </div>
      </div>
    );
  };

  const blocksToRender: ShiftType[] = [
    "Mañana",
    "Tarde",
    "Noche",
    "Trasnoche",
    "Franco Compensatorio",
  ];

  return (
    <>
      <div
        className={`min-h-[140px] xl:min-h-[180px] h-full p-1.5 xl:p-3 flex flex-col gap-1.5 transition-colors group ${
          isToday ? "ring-2 ring-blue-500 ring-inset" : "border-r border-b border-slate-200"
        } ${isWeekend ? "bg-slate-100" : "bg-slate-50"}`}
      >
        <div className="flex justify-between items-center mb-1 px-0.5">
          <span
            className={`text-sm xl:text-[15px] font-extrabold ${
              isToday ? "text-blue-600" : "text-slate-800"
            }`}
          >
            {format(date, "d")}
          </span>
          <span className={`text-[9px] xl:text-[10px] font-bold uppercase tracking-wider truncate w-16 text-right ${
            isWeekend ? "text-slate-500" : "text-slate-400"
          }`}>
            {format(date, "EEEE")}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 xl:gap-2 flex-1 justify-start">
          {blocksToRender.map(renderBlock)}
        </div>
      </div>

      {confirmModal && confirmModal.isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200"
          onClick={() => setConfirmModal(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-5 xl:p-6 max-w-sm w-full transform animate-in scale-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base xl:text-lg font-bold text-slate-800 mb-2">¿Confirmar Cambio de Turno?</h3>
            <p className="text-slate-600 text-xs xl:text-sm mb-5 leading-relaxed">
              Ya hay un agente asignado. ¿Deseas modificarlo por <span className="font-bold text-slate-800">{confirmModal.newAgentName}</span>?
            </p>
            
            <div className="flex justify-end gap-2 xl:gap-3 font-medium text-xs xl:text-sm">
              <button 
                onClick={() => setConfirmModal(null)}
                className="px-3 xl:px-4 py-1.5 xl:py-2 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => executeAssign(confirmModal.blockLabel, confirmModal.newAgentId)}
                className="px-3 xl:px-4 py-1.5 xl:py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                SÍ, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
