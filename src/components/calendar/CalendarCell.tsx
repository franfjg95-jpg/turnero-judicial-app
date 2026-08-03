import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, X, Search } from "lucide-react";
import { type ShiftType, type Agent, type Shift, type Feria } from "../../types";

interface Props {
  date: Date;
  agents: Agent[];
  shifts: Shift[];
  ferias: Feria[];
  onAssignShift: (date: Date, type: ShiftType, agentId: string) => Promise<void>;
  onRemoveAgent: (date: Date, type: ShiftType, agentId: string, shiftId?: string) => Promise<void>;
  onUpdateHorarioTurno: (date: Date, type: ShiftType, horario: string) => Promise<void>;
  isToday: boolean;
  isWeekend: boolean;
  isAdmin: boolean;
  isCurrentMonth?: boolean;
}

export function CalendarCell({
  date,
  agents,
  shifts,
  ferias,
  onAssignShift,
  onRemoveAgent,
  onUpdateHorarioTurno,
  isToday,
  isWeekend,
  isAdmin,
  isCurrentMonth = true,
}: Props) {
  const [loadingBlock, setLoadingBlock] = useState<ShiftType | null>(null);
  
  // Custom Select states
  const [openSelect, setOpenSelect] = useState<ShiftType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);

  const dateStr = format(date, "yyyy-MM-dd");
  const dayShifts = useMemo(() => shifts.filter((s) => s.fecha === dateStr), [shifts, dateStr]);

  const agentsOnFeriaIds = useMemo(() => {
    return ferias
      .filter(f => dateStr >= f.fecha_inicio && dateStr <= f.fecha_fin)
      .map(f => f.agente_id);
  }, [ferias, dateStr]);

  const allAssignedOnDayIds = useMemo(() => {
    return dayShifts.map((s) => s.agente_id).filter(Boolean);
  }, [dayShifts]);
  
  const [localSchedules, setLocalSchedules] = useState<Record<string, string>>({});
  
  const [deleteModal, setDeleteModal] = useState<{
    blockLabel: ShiftType;
    agentIdToRemove: string;
    agentName: string;
    shiftIdToRemove?: string;
  } | null>(null);
  
  useEffect(() => {
    const schedules: Record<string, string> = {};
    dayShifts.forEach(s => {
      schedules[s.tipo_turno] = s.horario_personalizado || "";
    });
    setLocalSchedules(schedules);
  }, [dayShifts]);
  
  const handleAssign = async (blockLabel: ShiftType, newAgentId: string) => {
    if (!newAgentId) return;
    
    const assignedShifts = dayShifts.filter((s) => s.tipo_turno === blockLabel);
    const assignedIds = assignedShifts.map(s => s.agente_id).filter(Boolean);

    if (assignedIds.includes(newAgentId)) return;
    if (assignedIds.length >= 6) return;

    setLoadingBlock(blockLabel);
    try {
      await onAssignShift(date, blockLabel, newAgentId);
    } finally {
      setLoadingBlock(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    setLoadingBlock(deleteModal.blockLabel);
    const { blockLabel, agentIdToRemove, shiftIdToRemove } = deleteModal;
    setDeleteModal(null);
    try {
      await onRemoveAgent(date, blockLabel, agentIdToRemove, shiftIdToRemove);
    } finally {
      setLoadingBlock(null);
    }
  };

  const renderBlock = (blockLabel: ShiftType) => {
    const assignedShifts = dayShifts.filter((s) => s.tipo_turno === blockLabel);
    const isIntermedio = blockLabel === "intermedio_1" || blockLabel === "intermedio_2";
    const displayLabel = isIntermedio ? "Turno Intermedio" : blockLabel;
    
    const assignedIds = assignedShifts.map(s => s.agente_id).filter(Boolean);
    const assignedAgents = assignedIds.map(id => agents.find(a => a.id === id)).filter(Boolean);
    
    const isSaving = loadingBlock === blockLabel;
    const currentHorario = assignedShifts.length > 0 ? (assignedShifts[0].horario_personalizado || "") : "";

    return (
      <div
        key={blockLabel}
        className={`flex flex-col gap-1 sm:gap-1.5 p-1 sm:p-2 xl:p-2.5 rounded-lg border min-h-[36px] sm:min-h-[50px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-sm ${
          blockLabel === "Franco Compensatorio"
            ? "bg-red-50/70 border-red-200"
            : blockLabel === "Trasnoche"
            ? "bg-blue-50/70 border-blue-200"
            : isIntermedio
            ? "bg-rose-50/70 border-rose-200"
            : "bg-white border-slate-200"
        } ${assignedAgents.length === 0 ? 'print:hidden' : ''}`}
      >
        <div className={`flex items-center w-full mb-0.5 ${blockLabel === "Franco Compensatorio" ? "justify-center text-center" : "justify-between"}`}>
          <span
            className={`font-bold text-[8px] sm:text-[10px] xl:text-xs uppercase tracking-tight flex items-center ${
              blockLabel === "Franco Compensatorio"
                ? "text-red-700 w-full justify-center"
                : blockLabel === "Trasnoche"
                ? "text-blue-700 gap-1"
                : isIntermedio
                ? "text-rose-800 gap-1"
                : "text-slate-700 gap-1"
            }`}
          >
            <span className={blockLabel === "Franco Compensatorio" ? "" : "truncate"}>{displayLabel}</span>
            
            {blockLabel !== "Franco Compensatorio" && (
              isAdmin && assignedAgents.length > 0 ? (
                <input
                   type="text"
                   maxLength={10}
                   placeholder="ej: 07-13 hs"
                   className="ml-1 w-20 text-[9px] xl:text-[10px] bg-slate-50/50 rounded border border-slate-200 outline-none focus:border-blue-400 focus:bg-white font-medium placeholder:text-slate-300 text-slate-600 px-1 py-0.5 transition-all capitalize tracking-normal"
                   value={localSchedules[blockLabel] ?? currentHorario}
                   onChange={(e) => setLocalSchedules({...localSchedules, [blockLabel]: e.target.value})}
                   onBlur={(e) => {
                     const val = e.target.value.trim();
                     if (val !== currentHorario) {
                       onUpdateHorarioTurno(date, blockLabel, val);
                     }
                   }}
                   onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                   }}
                />
              ) : (
                 currentHorario && (
                   <span className="ml-1 text-[9px] xl:text-[10px] font-semibold text-slate-500 bg-slate-100 rounded px-1 lowercase tracking-normal flex-shrink-0">
                     {currentHorario}
                   </span>
                 )
              )
            )}

            {isSaving && <Loader2 size={12} className="animate-spin text-blue-500 shrink-0 ml-1" />}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          {assignedAgents.length > 0 ? (
            <div className="flex flex-col gap-1.5 w-full mt-0.5">
              {assignedAgents.map((ag) => (
                <div key={ag?.id} className={`flex items-center justify-between text-[9px] sm:text-[11px] xl:text-[13px] font-semibold px-2 py-1 bg-white rounded-lg shadow-sm border transition-all hover:border-slate-350 ${isAdmin ? "border-slate-200" : "border-slate-100"}`}>
                  <span className="truncate text-slate-700 leading-tight" title={ag?.nombre}>{ag?.nombre}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const shiftRow = assignedShifts.find(s => s.agente_id === ag!.id);
                        setDeleteModal({
                          blockLabel,
                          agentIdToRemove: ag!.id,
                          agentName: ag!.nombre,
                          shiftIdToRemove: shiftRow?.id
                        });
                      }}
                      disabled={isSaving}
                      className="text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-md p-0.5 ml-2 shrink-0 transition-colors disabled:opacity-50 print:hidden"
                      title="Quitar sumariante"
                    >
                      <X size={12} strokeWidth={2.5} className="sm:w-[14px] sm:h-[14px]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !isAdmin && (
              <div className="text-[9px] sm:text-[11px] xl:text-xs font-semibold px-1 py-0.5 truncate text-slate-400 text-center bg-slate-100/50 rounded">
                - Libre -
              </div>
            )
          )}

          {isAdmin && assignedAgents.length < 6 && (
            <div className="relative mt-0.5 print:hidden">
              {openSelect === blockLabel && (
                <div className="fixed inset-0 z-[40]" onClick={() => setOpenSelect(null)}></div>
              )}
              {openSelect === blockLabel ? (
                <div className="absolute top-full left-0 mt-1 w-full z-[50] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 min-w-[170px]">
                  <div className="flex items-center px-2.5 py-1.5 border-b border-slate-150 bg-slate-50">
                    <Search size={14} className="text-slate-400 mr-1.5 shrink-0" />
                    <input
                      type="text"
                      className="w-full text-[10px] xl:text-xs outline-none bg-transparent text-slate-800 placeholder:text-slate-400 font-medium"
                      placeholder="Buscar..."
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setFocusedIndex(0);
                      }}
                      onKeyDown={(e) => {
                        const filtered = agents.filter(a => !allAssignedOnDayIds.includes(a.id) && a.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setFocusedIndex(prev => (prev + 1) % filtered.length);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setFocusedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          const selected = filtered[focusedIndex];
                          if (selected && !agentsOnFeriaIds.includes(selected.id)) {
                            handleAssign(blockLabel, selected.id);
                            setOpenSelect(null);
                            setSearchQuery("");
                          }
                        } else if (e.key === 'Escape') {
                          setOpenSelect(null);
                          setSearchQuery("");
                        }
                      }}
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto w-full flex flex-col py-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {(() => {
                      const filtered = agents.filter(a => !allAssignedOnDayIds.includes(a.id) && a.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
                      if (filtered.length === 0) {
                        return <div className="px-2 py-3 text-center text-[10px] xl:text-xs text-slate-450 italic">Sin resultados</div>;
                      }
                      return filtered.map((ag, idx) => {
                        const isFocused = focusedIndex === idx;
                        const isEnFeria = agentsOnFeriaIds.includes(ag.id);
                        return (
                           <button
                             key={ag.id}
                             disabled={isEnFeria}
                             className={`text-left px-3 py-1.5 text-[10px] xl:text-xs transition-colors flex justify-between items-center ${
                                isEnFeria ? 'opacity-40 bg-slate-50 cursor-not-allowed' :
                                isFocused ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-650 hover:bg-slate-50'}`}
                             onMouseEnter={() => !isEnFeria && setFocusedIndex(idx)}
                             onClick={() => {
                               if (isEnFeria) return;
                               handleAssign(blockLabel, ag.id);
                               setOpenSelect(null);
                               setSearchQuery("");
                             }}
                           >
                             <span className={isEnFeria ? "line-through" : ""}>{ag.nombre}</span>
                             {isEnFeria && <span className="text-[9px] xl:text-[10px] font-bold text-sky-650 mx-1 rounded-full bg-sky-50 px-2 py-0.5 whitespace-nowrap">🌴 Feria</span>}
                           </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : (
                <button
                  disabled={isSaving}
                  onClick={() => {
                    setOpenSelect(blockLabel);
                    setSearchQuery("");
                    setFocusedIndex(0);
                  }}
                  className={`flex items-center justify-between text-[10px] xl:text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-slate-500 w-full ${isSaving ? 'opacity-50 cursor-wait' : 'focus:border-blue-500 focus:bg-white hover:border-slate-350 hover:text-slate-700 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]'}`}
                >
                  <span className="truncate">{assignedAgents.length > 0 ? "+ Agregar" : "Asignar..."}</span>
                  <Search size={12} className="text-slate-400 shrink-0 ml-1" />
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    );
  };

  const blocksToRender: ShiftType[] = [
    "Mañana",
    "intermedio_1",
    "Tarde",
    "intermedio_2",
    "Noche",
    "Trasnoche",
    "Franco Compensatorio",
  ];

  return (
    <>
      <div
        className={`min-h-[140px] xl:min-h-[180px] h-full p-2 xl:p-3 flex flex-col gap-2 transition-all duration-300 rounded-xl border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
          isToday 
            ? "ring-2 ring-blue-500 ring-inset bg-blue-50/10" 
            : isWeekend 
            ? "bg-slate-100/65" 
            : "bg-white/80"
        } hover:shadow-md hover:border-slate-300/80 ${!isCurrentMonth ? 'print:min-h-[30px] print:h-[30px] print:bg-slate-50/10' : ''}`}
      >
        <div className="flex justify-between items-center mb-0.5 px-0.5">
          <span
            className={`text-sm xl:text-[15px] font-extrabold ${
              isToday ? "text-blue-600 bg-blue-50 w-7 h-7 flex items-center justify-center rounded-full" : "text-slate-800"
            }`}
          >
            {format(date, "d")}
          </span>
          <span className={`text-[9px] xl:text-[10px] font-bold uppercase tracking-wider truncate w-16 text-right ${
            isWeekend ? "text-slate-500" : "text-slate-450"
          }`}>
            {format(date, "EEEE", { locale: es })}
          </span>
        </div>

        <div className={`flex flex-col gap-1.5 xl:gap-2 flex-1 justify-start ${!isCurrentMonth ? 'print:hidden' : ''}`}>
          {blocksToRender.map(renderBlock)}
        </div>
      </div>

      {deleteModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                ¿Quitar sumariante?
              </h3>
              <p className="text-slate-650 text-sm leading-relaxed">
                ¿Estás seguro de que quieres eliminar a <span className="font-semibold text-slate-900">{deleteModal.agentName}</span> de este turno?
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all duration-250 bg-white border border-slate-200"
                disabled={loadingBlock !== null}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loadingBlock !== null}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-650 hover:bg-red-700 rounded-xl transition-all duration-250 shadow-sm flex items-center gap-2"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
