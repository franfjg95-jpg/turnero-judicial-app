import { supabase } from "../lib/supabase";
import type { Agent, Shift, ShiftType, Profile, Feria } from "../types";

export const api = {
  auth: {
    async deleteProfile(id: string): Promise<void> {
      const { error } = await supabase.from('perfiles').delete().eq('id', id);
      if (error) throw error;
    },
    async getProfile(id: string): Promise<Profile> {
      const { data, error } = await supabase.from('perfiles').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async getPendingProfiles(adminId: string): Promise<Profile[]> {
      const { data, error } = await supabase.from('perfiles').select('*').eq('estado', 'pendiente').eq('admin_id', adminId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async authorizeProfile(id: string): Promise<void> {
      const { error } = await supabase.from('perfiles').update({ estado: 'aprobado' }).eq('id', id);
      if (error) throw error;
    },
    async updateWorkerCredentials(adminId: string, username: string, password: string): Promise<void> {
      const { error } = await supabase.from('perfiles').update({ trabajador_usuario: username, trabajador_clave: password }).eq('id', adminId);
      if (error) throw error;
    }
  },
  agents: {
    async getAll(adminId: string): Promise<Agent[]> {
      const { data, error } = await supabase
        .from("agentes")
        .select("*")
        .eq("admin_id", adminId)
        .order("nombre");
      if (error) throw error;
      return data || [];
    },
    async create(agent: Omit<Agent, "id">, adminId: string): Promise<Agent> {
      const { data, error } = await supabase
        .from("agentes")
        .insert([{ ...agent, admin_id: adminId }])
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
    async getByDateRange(startDate: string, endDate: string, adminId: string): Promise<Shift[]> {
      const { data, error } = await supabase
        .from("turnos")
        .select("*")
        .eq("admin_id", adminId)
        .gte("fecha", startDate)
        .lte("fecha", endDate);
      if (error) throw error;
      return data || [];
    },
    async assign(fecha: string, tipo_turno: ShiftType, agente_id: string, adminId: string, horario_personalizado?: string): Promise<Shift> {
      // 1. Obtener horario personalizado de otros agentes en el mismo turno si existe
      const { data: existing } = await supabase.from('turnos').select('*').match({fecha, tipo_turno, admin_id: adminId}).limit(1);
      
      const payload: any = { fecha, tipo_turno, agente_id, admin_id: adminId };
      if (horario_personalizado !== undefined) {
         payload.horario_personalizado = horario_personalizado;
      } else if (existing && existing.length > 0) {
         payload.horario_personalizado = existing[0].horario_personalizado;
      }

      // 2. Revisar si este agente ya está insertado para no duplicar error
      const { data: duplicate } = await supabase.from('turnos').select('*').match({fecha, tipo_turno, agente_id, admin_id: adminId}).maybeSingle();
      if (duplicate) return duplicate;

      // 3. Insertamos el nuevo agente en SU PROPIA FILA
      const { data, error } = await supabase.from('turnos').insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    async updateHorarioPorTurno(fecha: string, tipo_turno: ShiftType, horario_personalizado: string, adminId: string): Promise<void> {
      const { error } = await supabase.from('turnos').update({ horario_personalizado }).match({ fecha, tipo_turno, admin_id: adminId });
      if (error) throw error;
    },
    async removeAgent(fecha: string, tipo_turno: ShiftType, agente_id: string, adminId: string): Promise<void> {
      const { error } = await supabase
        .from("turnos")
        .delete()
        .match({ fecha, tipo_turno, agente_id, admin_id: adminId });
      if (error) throw error;
    },
    async removeShiftById(id: string): Promise<void> {
      const { error } = await supabase.from('turnos').delete().eq('id', id);
      if (error) throw error;
    },
  },
  ferias: {
    async getAll(adminId: string): Promise<Feria[]> {
      const { data, error } = await supabase
        .from("ferias")
        .select(`
          *,
          agentes (
            nombre
          )
        `)
        .eq("admin_id", adminId)
        .order("fecha_inicio", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async create(feria: { agente_id: string; fecha_inicio: string; fecha_fin: string; motivo?: string | null }, adminId: string): Promise<Feria> {
      const { data, error } = await supabase
        .from("ferias")
        .insert([{ ...feria, admin_id: adminId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("ferias").delete().eq("id", id);
      if (error) throw error;
    },
  },
  
  getNotification: async (adminId: string) => {
    const { data, error } = await supabase
      .from("notificaciones")
      .select("*")
      .eq("admin_id", adminId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  updateNotification: async (mensaje: string, adminId: string) => {
    const { data, error } = await supabase
      .from("notificaciones")
      .upsert({ admin_id: adminId, mensaje }, { onConflict: 'admin_id' })
      .select()
      .single();
    if (error) {
      console.error("Error original de Supabase (API):", error);
      throw error;
    }
    return data;
  },
};
