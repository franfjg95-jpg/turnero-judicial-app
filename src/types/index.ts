export interface Agent {
  id: string;
  nombre: string;
  puesto: string;
}

export type ShiftType =
  | "Trasnoche"
  | "Mañana"
  | "Tarde"
  | "Noche"
  | "Franco Compensatorio"
  // Adicionales sugeridos por la imagen:
  | "10:00 a 16:00"
  | "18:00 a 00:00";

export interface Shift {
  id?: string;
  agente_id: string;
  fecha: string; // YYYY-MM-DD
  tipo_turno: ShiftType;
  observaciones?: string;
  horario_personalizado?: string;
}
