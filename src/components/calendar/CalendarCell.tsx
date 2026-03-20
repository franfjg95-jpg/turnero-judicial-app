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
        className={`flex items-start justify-between p-1.5 rounded-sm text-xs transition-colors ${
          blockLabel === "Franco Compensatorio"
            ? "bg-red-50 border border-red-200"
            : blockLabel === "Trasnoche"
            ? "bg-blue-50 border border-blue-200"
            : "bg-slate-50 border border-slate-100"
        }`}
      >
        <div className="flex items-center gap-1 w-[38%] pt-1">
          <span
            className={`font-semibold ${
              blockLabel === "Franco Compensatorio"
                ? "text-red-700"
                : blockLabel === "Trasnoche"
                ? "text-blue-700"
                : "text-slate-600"
            } truncate`}
            title={blockLabel}
          >
            {blockLabel}
          </span>
          <button
            onClick={() => setEditingBlock(isEditing ? null : blockLabel)}
            className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded-full hover:bg-white"
            title="Editar horario..."
          >
            <Clock size={12} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-1 ml-1">
          <select
            className="text-xs bg-white border border-slate-200 rounded p-1 outline-none text-slate-800 focus:ring-1 focus:ring-blue-500 cursor-pointer w-full transition-shadow hover:border-slate-300"
            value={assigned?.agente_id || ""}
            onChange={(e) => {
              onAssignShift(date, blockLabel, e.target.value);
              setEditingBlock(null);
            }}
          >
            <option value="">- Asignar -</option>
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
              className="text-[10px] w-full border-b border-blue-300 bg-transparent outline-none pb-0.5 px-0.5 text-blue-700 placeholder:text-blue-300 transition-colors focus:border-blue-600"
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
                className="text-[10px] text-slate-500 flex items-center gap-1 px-1 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setEditingBlock(blockLabel)}
                title="Clic para editar"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                <span>{assigned.horario_personalizado}</span>
              </span>
            )
          )}
        </div>
      </div>
    );
  };

  const weekdayBlocks: ShiftType[] = [
    "Mañana",
    "Tarde",
    "Noche",
    "Trasnoche",
    "Franco Compensatorio",
  ];
  const weekendBlocks: ShiftType[] = [
    "Finde Sábado",
    "Finde Domingo",
    "Trasnoche",
    "Franco Compensatorio",
  ];

  const blocksToRender = isWeekend ? weekendBlocks : weekdayBlocks;

  return (
    <div
      className={`min-h-[160px] bg-white border border-slate-200 p-2 flex flex-col gap-1.5 transition-all hover:shadow-md ${
        isToday ? "ring-2 ring-blue-500 ring-inset" : ""
      } ${isWeekend ? "bg-slate-50/50" : ""}`}
    >
      <div className="flex justify-between items-center mb-1">
        <span
          className={`text-sm font-bold ${
            isToday ? "text-blue-600" : "text-slate-700"
          }`}
        >
          {format(date, "d")}
        </span>
        <span className="text-[10px] text-slate-400 font-medium uppercase truncate w-16 text-right">
          {format(date, "EEEE")}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 justify-start">
        {blocksToRender.map(renderBlock)}
      </div>
    </div>
  );
}
