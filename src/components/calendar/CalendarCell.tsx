import { useState } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { type ShiftType, type Agent, type Shift } from "../../types";

interface Props {
  date: Date;
  agents: Agent[];
  shifts: Shift[];
  onAssignShift: (date: Date, type: ShiftType, agentId: string) => void;
  onUpdateHorario: (date: Date, type: ShiftType, horario: string) => void;
  isToday: boolean;
  isWeekend: boolean;
}

export function CalendarCell({
  date,
  agents,
  shifts,
  onAssignShift,
  onUpdateHorario,
  isToday,
  isWeekend,
}: Props) {
  const [editingBlock, setEditingBlock] = useState<ShiftType | null>(null);
  const [localTimes, setLocalTimes] = useState<{ [key: string]: string }>({});

  const dateStr = format(date, "yyyy-MM-dd");
  const dayShifts = shifts.filter((s) => s.fecha === dateStr);

  const handleBlur = (blockLabel: ShiftType, assignedAgent: string | undefined, value: string) => {
    if (!assignedAgent && value.trim() !== "") {
      alert("Debes seleccionar un agente primero para guardar este horario personalizado.");
      return;
    }
    // Only call update if it actually changed to avoid unnecessary DB calls (handled loosely here by just calling blur)
    if (assignedAgent) {
      onUpdateHorario(date, blockLabel, value);
    }
    setEditingBlock(null);
  };

  const renderBlock = (blockLabel: ShiftType) => {
    const assigned = dayShifts.find((s) => s.tipo_turno === blockLabel);
    const isEditing = editingBlock === blockLabel;

    return (
      <div
        key={blockLabel}
        className={`flex flex-col gap-1.5 p-2 rounded-md transition-shadow border ${
          blockLabel === "Franco Compensatorio"
            ? "bg-red-50 border-red-400"
            : blockLabel === "Trasnoche"
            ? "bg-blue-50 border-blue-400"
            : "bg-white border-slate-400 shadow-sm hover:shadow-md"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span
            className={`font-bold text-[10px] sm:text-[11px] uppercase tracking-tight leading-none ${
              blockLabel === "Franco Compensatorio"
                ? "text-red-700"
                : blockLabel === "Trasnoche"
                ? "text-blue-700"
                : "text-slate-700"
            }`}
          >
            {blockLabel}
          </span>
          <button
            onClick={() => setEditingBlock(isEditing ? null : blockLabel)}
            className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-100"
            title="Editar horario..."
          >
            <Clock size={13} strokeWidth={2.5} />
          </button>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          <select
            className="text-xs font-medium bg-white border border-slate-200 rounded p-1.5 outline-none text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer w-full transition-shadow hover:border-slate-300"
            value={assigned?.agente_id || ""}
            onChange={(e) => {
              onAssignShift(date, blockLabel, e.target.value);
              setEditingBlock(null);
            }}
          >
            <option value="">- Sin asignar -</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.nombre}
              </option>
            ))}
          </select>

          {isEditing ? (
            <input
              type="text"
              placeholder="Ej. 07 a 14hs"
              className="text-[11px] w-full border-b-2 border-blue-400 bg-slate-50 shadow-inner rounded-t-sm outline-none px-1.5 py-1 text-blue-800 placeholder:text-blue-300 transition-colors focus:border-blue-600"
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
                className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 px-1 pb-0.5 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setEditingBlock(blockLabel)}
                title="Clic para editar"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50"></div>
                <span>{assigned.horario_personalizado}</span>
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
    <div
      className={`min-h-[160px] h-full p-2.5 sm:p-3 flex flex-col gap-2 transition-all group ${
        isToday ? "ring-2 ring-blue-500 ring-inset" : "border-r border-b border-slate-200"
      } ${isWeekend ? "bg-slate-100" : "bg-slate-50"}`}
    >
      <div className="flex justify-between items-center mb-1.5 px-0.5">
        <span
          className={`text-[15px] font-extrabold ${
            isToday ? "text-blue-600" : "text-slate-800"
          }`}
        >
          {format(date, "d")}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider truncate w-16 text-right ${
          isWeekend ? "text-slate-500" : "text-slate-400"
        }`}>
          {format(date, "EEEE")}
        </span>
      </div>

      <div className="flex flex-col gap-2 flex-1 justify-start">
        {blocksToRender.map(renderBlock)}
      </div>
    </div>
  );
}
