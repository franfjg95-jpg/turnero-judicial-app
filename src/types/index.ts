export type ShiftType = 'mañana' | 'tarde' | 'noche' | 'Mañana' | 'Tarde' | 'Noche' | 'Trasnoche' | 'Franco Compensatorio';

export interface Agent {
  id: string;
  nombre: string;
  puesto: string;
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
  created_at: string;
}
