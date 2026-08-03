export type ShiftType = 'mañana' | 'tarde' | 'noche' | 'Mañana' | 'Tarde' | 'Noche' | 'Trasnoche' | 'Franco Compensatorio' | 'intermedio_1' | 'intermedio_2';

export interface Agent {
  id: string;
  nombre: string;
  puesto: string;
  usuario?: string;
  clave?: string;
}

export interface Shift {
  id?: string;
  agente_id: string;
  fecha: string; // YYYY-MM-DD
  tipo_turno: ShiftType;
  observaciones?: string;
  horario_personalizado?: string;
}

export interface Profile {
  id: string;
  email: string;
  nombre?: string;
  estado: 'pendiente' | 'aprobado';
  is_admin: boolean;
  admin_id?: string | null;
  trabajador_usuario?: string | null;
  trabajador_clave?: string | null;
  created_at: string;
}

export interface Feria {
  id?: string;
  agente_id: string;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string;    // YYYY-MM-DD
  motivo?: string | null;
  created_at?: string;
  agentes?: {
    nombre: string;
  };
}
