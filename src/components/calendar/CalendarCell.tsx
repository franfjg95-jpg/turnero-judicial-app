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
        className={`flex flex-col gap-1 sm:gap-1.5 p-1 sm:p-1.5 xl:p-2.5 rounded-md border min-h-[36px] sm:min-h-[50px] ${
          blockLabel === "Franco Compensatorio"
            ? "bg-red-50 border-red-300"
            : blockLabel === "Trasnoche"
            ? "bg-blue-50 border-blue-300"
            : isIntermedio
            ? "bg-rose-50 border-rose-200"
            : "bg-white border-slate-300"
        }`}
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
                   className="ml-0.5 xl:ml-1 w-20 text-[9px] xl:text-[10px] bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-blue-400 font-medium placeholder:text-slate-300 text-slate-600 px-0.5 capitalize tracking-normal"
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
                   <span className="ml-0.5 xl:ml-1 text-[9px] xl:text-[10px] font-semibold text-slate-500 lowercase tracking-normal flex-shrink-0">
                     ({currentHorario})
                   </span>
                 )
              )
            )}

            {isSaving && <Loader2 size={12} className="animate-spin text-blue-500 shrink-0 ml-1" />}
          </span>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          {assignedAgents.length > 0 ? (
            <div className="flex flex-col gap-1 w-full mt-1">
              {assignedAgents.map((ag) => (
                <div key={ag?.id} className={`flex items-center justify-between text-[9px] sm:text-[11px] xl:text-[13px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white rounded shadow-sm border ${isAdmin ? "border-slate-300" : "border-slate-200"}`}>
                  <span className="truncate text-slate-800 leading-tight" title={ag?.nombre}>{ag?.nombre}</span>
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
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded p-1 ml-2 shrink-0 transition-colors disabled:opacity-50 print:hidden"
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
              <div className="text-[9px] sm:text-[11px] xl:text-xs font-semibold px-1 py-0.5 sm:py-1 truncate text-slate-400">
                - Libre -
              </div>
            )
          )}

          {isAdmin && assignedAgents.length < 6 && (
            <div className="relative mt-1 print:hidden">
              {openSelect === blockLabel && (
                <div className="fixed inset-0 z-[40]" onClick={() => setOpenSelect(null)}></div>
              )}
              {openSelect === blockLabel ? (
                <div className="absolute top-0 left-0 w-full z-[50] bg-white border border-slate-300 rounded shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[150px]">
                  <div className="flex items-center px-2 py-1.5 border-b border-slate-200 bg-slate-50">
                    <Search size={14} className="text-slate-400 mr-1.5 shrink-0" />
                    <input
                      type="text"
                      className="w-full text-[10px] xl:text-xs outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
                      placeholder="Buscar sumariante..."
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setFocusedIndex(0);
                      }}
                      onKeyDown={(e) => {
                        const filtered = agents.filter(a => !assignedIds.includes(a.id) && a.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
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
                  <div className="max-h-36 overflow-y-auto w-full flex flex-col py-0.5 scrollbar-thin scrollbar-thumb-slate-200">
                    {(() => {
                      const filtered = agents.filter(a => !assignedIds.includes(a.id) && a.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
                      if (filtered.length === 0) {
                        return <div className="px-2 py-2 text-center text-[10px] xl:text-xs text-slate-500 italic">Sin resultados</div>;
                      }
                      return filtered.map((ag, idx) => {
                        const isFocused = focusedIndex === idx;
                        const isEnFeria = agentsOnFeriaIds.includes(ag.id);
                        return (
                          <button
                            key={ag.id}
                            disabled={isEnFeria}
                            className={`text-left px-2 py-1.5 text-[10px] xl:text-xs transition-colors flex justify-between items-center ${
                               isEnFeria ? 'opacity-50 bg-slate-50 cursor-not-allowed' :
                               isFocused ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                            onMouseEnter={() => !isEnFeria && setFocusedIndex(idx)}
                            onClick={() => {
                              if (isEnFeria) return;
                              handleAssign(blockLabel, ag.id);
                              setOpenSelect(null);
                              setSearchQuery("");
                            }}
                          >
                            <span className={isEnFeria ? "line-through decoration-slate-300" : ""}>{ag.nombre}</span>
                            {isEnFeria && <span className="text-[9px] xl:text-[10px] font-bold text-sky-600 mx-1 rounded bg-sky-100 px-1.5 py-0.5 whitespace-nowrap">🌴 En Feria</span>}
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
                  className={`flex items-center justify-between text-[10px] xl:text-xs font-medium bg-white border border-slate-300 rounded p-1.5 outline-none text-slate-600 w-full ${isSaving ? 'opacity-50 cursor-wait' : 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-400 shadow-sm hover:text-slate-800 transition-colors'}`}
                >
                  <span className="truncate">{assignedAgents.length > 0 ? "+ Agregar sumariante..." : "Seleccionar sumariante..."}</span>
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
            {format(date, "EEEE", { locale: es })}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 xl:gap-2 flex-1 justify-start">
          {blocksToRender.map(renderBlock)}
        </div>
      </div>

      {deleteModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                ¿Quitar sumariante?
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                ¿Estás seguro de que quieres eliminar a <span className="font-semibold text-slate-800">{deleteModal.agentName}</span> de este turno?
              </p>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={loadingBlock !== null}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loadingBlock !== null}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
              >
                {loadingBlock !== null && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
