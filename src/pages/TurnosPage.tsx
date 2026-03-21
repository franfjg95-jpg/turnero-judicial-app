import { useEffect, useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday as isTodayFn, isWeekend as isWeekendFn, startOfWeek, endOfWeek, addDays, isBefore, startOfDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays, X } from "lucide-react";
import { CalendarCell } from "../components/calendar/CalendarCell";
import { NotificationBanner } from "../components/calendar/NotificationBanner";
import { api } from "../api/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Agent, Shift, ShiftType } from "../types";

const FERIADOS_2026 = [
  { date: "2026-03-23", name: "Fines Turísticos", type: "Turístico" },
  { date: "2026-03-24", name: "Día de la Memoria por la Verdad y la Justicia", type: "Inamovible" },
  { date: "2026-04-02", name: "Veteranos y Caídos en Malvinas", type: "Inamovible" },
  { date: "2026-04-03", name: "Viernes Santo", type: "Inamovible" },
  { date: "2026-05-01", name: "Día del Trabajador", type: "Inamovible" },
  { date: "2026-05-25", name: "Revolución de Mayo", type: "Inamovible" },
  { date: "2026-06-15", name: "Paso a la Inmortalidad de Güemes", type: "Trasladado" },
  { date: "2026-06-20", name: "Paso a la Inmortalidad de Belgrano", type: "Inamovible" },
  { date: "2026-07-09", name: "Independencia", type: "Inamovible" },
  { date: "2026-07-10", name: "Fines Turísticos", type: "Turístico" },
  { date: "2026-08-17", name: "Paso a la Inmortalidad de San Martín", type: "Trasladable" },
  { date: "2026-10-12", name: "Día del Respeto a la Diversidad Cultural", type: "Trasladable" },
  { date: "2026-11-23", name: "Día de la Soberanía Nacional", type: "Trasladado" },
  { date: "2026-12-07", name: "Fines Turísticos", type: "Turístico" },
  { date: "2026-12-08", name: "Inmaculada Concepción", type: "Inamovible" },
  { date: "2026-12-25", name: "Navidad", type: "Inamovible" }
];

export function TurnosPage() {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeriadosModal, setShowFeriadosModal] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const daysInCalendar = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const sDateStr = format(startDate, "yyyy-MM-dd");
      const eDateStr = format(endDate, "yyyy-MM-dd");

      const [agentsData, shiftsData] = await Promise.all([
        api.agents.getAll(),
        api.shifts.getByDateRange(sDateStr, eDateStr),
      ]);

      setAgents(agentsData);
      setShifts(shiftsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleAssignShift = async (date: Date, type: ShiftType, agentId: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    try {
      if (agentId) {
        await api.shifts.assign(dateStr, type, agentId);
        if (type === "Trasnoche") {
          const nextDateStr = format(addDays(date, 1), "yyyy-MM-dd");
          await api.shifts.assign(nextDateStr, "Franco Compensatorio", agentId);
        }
      }
      await loadData();
    } catch (err: any) {
      setError("Error al asignar sumariante: " + err.message);
    }
  };

  const handleRemoveAgentFromShift = async (date: Date, type: ShiftType, agentId: string, shiftId?: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    try {
       if (shiftId) {
          await api.shifts.removeShiftById(shiftId);
       } else {
          await api.shifts.removeAgent(dateStr, type, agentId);
       }
       if (type === "Trasnoche") {
          const nextDateStr = format(addDays(date, 1), "yyyy-MM-dd");
          await api.shifts.removeAgent(nextDateStr, "Franco Compensatorio", agentId);
       }
       await loadData();
    } catch (err: any) {
       setError("Error al quitar sumariante: " + err.message);
    }
  };

  const handleUpdateHorarioTurno = async (date: Date, type: ShiftType, horario: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    try {
      await api.shifts.updateHorarioPorTurno(dateStr, type, horario);
      await loadData();
    } catch (err: any) {
      setError("Error al guardar el horario: " + err.message);
    }
  };

  const weekDaysHeaders = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const upcomingHolidays = FERIADOS_2026.filter(feriado => {
     return !isBefore(parseISO(feriado.date), monthStart);
  });

  return (
    <div className="w-full max-w-screen-2xl mx-auto p-2 sm:p-4 xl:p-6 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Calendario Mensual
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Gestión de turnos y guardias operativas</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button 
            onClick={() => setShowFeriadosModal(true)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-slate-700 font-semibold text-sm h-10 sm:h-auto"
            title="Ver calendario de feriados"
          >
             <CalendarDays size={18} className="text-blue-600" />
             <span>Feriados 2026</span>
          </button>
          
          <div className="flex flex-1 items-center justify-between sm:justify-center w-full sm:w-auto gap-2 sm:gap-4 bg-white px-3 sm:px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <button onClick={prevMonth} disabled={loading} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 disabled:opacity-50">
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold text-slate-700 min-w-[120px] sm:min-w-[160px] text-center capitalize text-base sm:text-lg">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </span>
            <button onClick={nextMonth} disabled={loading} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 disabled:opacity-50">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <NotificationBanner />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
        <div className="min-w-[800px] xl:min-w-[1024px]">
          {/* Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekDaysHeaders.map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          
          {/* Grid de Días */}
          <div className="grid grid-cols-7 border-l border-t border-slate-200 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            
            {daysInCalendar.map((day) => {
              const isToday = isTodayFn(day);
              const isWeekend = isWeekendFn(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              
              const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
              const canEdit = isAdmin && !isPast;

              return (
                 <div key={day.toISOString()} className={`transition-opacity h-full flex flex-col ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                   <CalendarCell 
                     date={day}
                     isToday={isToday}
                     isWeekend={isWeekend}
                     isAdmin={canEdit}
                     agents={agents}
                     shifts={shifts}
                     onAssignShift={handleAssignShift}
                     onRemoveAgent={handleRemoveAgentFromShift}
                     onUpdateHorarioTurno={handleUpdateHorarioTurno}
                   />
                 </div>
              )
            })}
          </div>
        </div>
      </div>

      {showFeriadosModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setShowFeriadosModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-800 tracking-tight">Feriados Nacionales</h2>
              </div>
              <button 
                onClick={() => setShowFeriadosModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="overflow-y-auto p-4 custom-scrollbar bg-white">
              <div className="space-y-2">
                {upcomingHolidays.length === 0 ? (
                  <p className="text-[13px] text-slate-500 text-center py-6">No hay más feriados programados para este año.</p>
                ) : (
                  upcomingHolidays.map((f, idx) => {
                    const dateObj = parseISO(f.date);
                    const monthName = format(dateObj, "MMMM", { locale: es });
                    const showMonth = idx === 0 || parseISO(upcomingHolidays[idx - 1].date).getMonth() !== dateObj.getMonth();
                    
                    return (
                      <div key={f.date}>
                        {showMonth && (
                          <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-2 mt-4 first:mt-0 capitalize">
                            {monthName}
                          </h3>
                        )}
                        <div className="flex items-start gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors mb-1 border border-slate-100/50 hover:border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                          <div className="bg-blue-50 text-blue-700 rounded-md min-w-[32px] h-8 flex flex-col items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                             <span className="text-sm font-bold leading-none">{format(dateObj, "d")}</span>
                          </div>
                          <div className="flex flex-col flex-1 min-w-0 justify-center">
                            <span className="text-[13px] font-bold text-slate-800 leading-tight mb-0.5 break-words">{f.name}</span>
                            <span className="text-[11px] text-slate-500 font-medium leading-none">{f.type}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
