import { supabase } from "../lib/supabase";
import type { Agent, Shift, ShiftType } from "../types";

export const api = {
  agents: {
    async getAll(): Promise<Agent[]> {
      const { data, error } = await supabase
        .from("agentes")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
    async create(agent: Omit<Agent, "id">): Promise<Agent> {
      const { data, error } = await supabase
        .from("agentes")
        .insert([agent])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id: string, agent: Partial<Agent>): Promise<Agent> {
      const { data, error } = await supabase
        .from("agentes")
        .update(agent)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("agentes").delete().eq("id", id);
      if (error) throw error;
    },
  },
  shifts: {
    async getByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
      const { data, error } = await supabase
        .from("turnos")
        .select("*")
        .gte("fecha", startDate)
        .lte("fecha", endDate);
      if (error) throw error;
      return data || [];
    },
    async assign(fecha: string, tipo_turno: ShiftType, agente_id: string, horario_personalizado?: string): Promise<Shift> {
      const { data: existing } = await supabase.from('turnos').select('*').match({fecha, tipo_turno}).maybeSingle();
      
      const payload: any = { fecha, tipo_turno, agente_id };
      if (horario_personalizado !== undefined) {
         payload.horario_personalizado = horario_personalizado;
      } else if (existing) {
         payload.horario_personalizado = existing.horario_personalizado;
      }

      if (existing) {
         const { data, error } = await supabase.from('turnos').update(payload).eq('id', existing.id).select().single();
         if (error) throw error;
         return data;
      } else {
         const { data, error } = await supabase.from('turnos').insert([payload]).select().single();
         if (error) throw error;
         return data;
      }
    },
    async updateHorario(fecha: string, tipo_turno: ShiftType, horario_personalizado: string): Promise<Shift> {
      const { data: existing } = await supabase.from('turnos').select('*').match({fecha, tipo_turno}).maybeSingle();
      if (!existing) {
         throw new Error("Debes seleccionar un agente antes de establecer un horario personalizado.");
      }
      const { data, error } = await supabase.from('turnos').update({ horario_personalizado }).eq('id', existing.id).select().single();
      if (error) throw error;
      return data;
    },
    async remove(fecha: string, tipo_turno: ShiftType): Promise<void> {
      const { error } = await supabase
        .from("turnos")
        .delete()
        .match({ fecha, tipo_turno });
      if (error) throw error;
    },
  },
};
