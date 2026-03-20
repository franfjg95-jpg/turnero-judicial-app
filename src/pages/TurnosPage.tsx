import { useEffect, useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday as isTodayFn, isWeekend as isWeekendFn, startOfWeek, endOfWeek, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { CalendarCell } from "../components/calendar/CalendarCell";
import { NotificationBanner } from "../components/calendar/NotificationBanner";
import { api } from "../api/supabase";
import { useAuth } from "../contexts/AuthContext";
import type { Agent, Shift, ShiftType } from "../types";

export function TurnosPage() {
  const { user, profile } = useAuth();
  const isAdmin = user?.email === 'toledomariajulieta.mpf@gmail.com' || profile?.is_admin === true;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      if (!agentId) {
        // Desasignar
        await api.shifts.remove(dateStr, type);
        
        // Si removemos Trasnoche, remover el franco del día siguiente
        if (type === "Trasnoche") {
          const nextDateStr = format(addDays(date, 1), "yyyy-MM-dd");
          await api.shifts.remove(nextDateStr, "Franco Compensatorio");
        }
      } else {
        // Asignar (hace upsert)
        await api.shifts.assign(dateStr, type, agentId);
        
        // Asignar automáticamente el franco al día siguiente si es Trasnoche
        if (type === "Trasnoche") {
          const nextDateStr = format(addDays(date, 1), "yyyy-MM-dd");
          await api.shifts.assign(nextDateStr, "Franco Compensatorio", agentId);
        }
      }
      // Recargar para tener el estado real de la DB sin recargar toda la pag asíncronamente
      await loadData();
    } catch (err: any) {
      setError("Error al actualizar turno: " + err.message);
    }
  };

  const handleUpdateHorario = async (date: Date, type: ShiftType, horario: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    try {
      await api.shifts.updateHorario(dateStr, type, horario);
      // Solo actualizamos de fondo
      const sDateStr = format(startDate, "yyyy-MM-dd");
      const eDateStr = format(endDate, "yyyy-MM-dd");
      const shiftsData = await api.shifts.getByDateRange(sDateStr, eDateStr);
      setShifts(shiftsData);
    } catch (err: any) {
      setError("Error al guardar el horario personalizado: " + err.message);
    }
  }

  const weekDaysHeaders = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <div className="w-full max-w-screen-2xl mx-auto p-2 sm:p-4 xl:p-6 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Calendario Mensual
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Gestión de turnos y guardias operativas</p>
        </div>
        <div className="flex items-center justify-between sm:justify-center w-full sm:w-auto gap-2 sm:gap-4 bg-white px-3 sm:px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
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
                     onUpdateHorario={handleUpdateHorario}
                   />
                 </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
