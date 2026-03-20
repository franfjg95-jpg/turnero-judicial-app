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
    async assign(fecha: string, tipo_turno: ShiftType, agente_id: string): Promise<Shift> {
      // Intenta borrar si ya existe un turno en este bloque para esta fecha
      await supabase
        .from("turnos")
        .delete()
        .match({ fecha, tipo_turno });

      // Inserta el nuevo
      const { data, error } = await supabase
        .from("turnos")
        .insert([{ fecha, tipo_turno, agente_id }])
        .select()
        .single();
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
