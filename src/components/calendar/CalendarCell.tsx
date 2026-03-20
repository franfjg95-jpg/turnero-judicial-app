import { format } from "date-fns";
import { type ShiftType, type Agent, type Shift } from "../../types";

interface Props {
  date: Date;
  agents: Agent[];
  shifts: Shift[];
  onAssignShift: (date: Date, type: ShiftType, agentId: string) => void;
  isToday: boolean;
  isWeekend: boolean;
}

export function CalendarCell({
  date,
  agents,
  shifts,
  onAssignShift,
  isToday,
  isWeekend,
}: Props) {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayShifts = shifts.filter((s) => s.fecha === dateStr);

  const renderBlock = (blockLabel: ShiftType) => {
    // Find if someone is assigned to this block today
    const assigned = dayShifts.find((s) => s.tipo_turno === blockLabel);

    return (
      <div
        key={blockLabel}
        className={`flex items-center justify-between p-1 rounded-sm text-xs ${
          blockLabel === "Franco Compensatorio"
            ? "bg-red-50 border border-red-200"
            : blockLabel === "Trasnoche"
            ? "bg-blue-50 border border-blue-200"
            : "bg-slate-50 border border-slate-100"
        }`}
      >
        <span
          className={`font-semibold ${
            blockLabel === "Franco Compensatorio"
              ? "text-red-700"
              : blockLabel === "Trasnoche"
              ? "text-blue-700"
              : "text-slate-600"
          } truncate w-1/3`}
          title={blockLabel}
        >
          {blockLabel}
        </span>
        <select
          className="text-xs bg-white border-none rounded p-0.5 outline-none flex-1 ml-2 text-slate-800 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          value={assigned?.agente_id || ""}
          onChange={(e) => onAssignShift(date, blockLabel, e.target.value)}
        >
          <option value="">- Asignar -</option>
          {agents.map((ag) => (
            <option key={ag.id} value={ag.id}>
              {ag.nombre}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const weekdayBlocks: ShiftType[] = [
    "Trasnoche",
    "Mañana",
    "Tarde",
    "Noche",
    "Franco Compensatorio",
  ];
  
  const weekendBlocks: ShiftType[] = [
    "Trasnoche",
    "Finde Sábado",
    "Finde Domingo",
    "Franco Compensatorio",
  ];

  const blocksToRender = isWeekend ? weekendBlocks : weekdayBlocks;

  return (
    <div
      className={`min-h-[140px] bg-white border border-slate-200 p-2 flex flex-col gap-1 transition-all hover:shadow-md ${
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
