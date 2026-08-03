-- SCRIPT DE MIGRACIÓN PARA TURNERO UJ (EJECUTAR EN EL SQL EDITOR DE SUPABASE)

-- 1. Añadir columna admin_id en las tablas existentes (si no existen)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE agentes ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ferias ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Añadir restricción de unicidad para la tabla notificaciones para permitir upsert por admin_id
ALTER TABLE notificaciones ADD CONSTRAINT unique_admin_notification UNIQUE (admin_id);

-- 3. Añadir columnas de credenciales compartidas para trabajadores
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS trabajador_usuario TEXT;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS trabajador_clave TEXT;

-- 4. Añadir columnas de credenciales individuales en la tabla agentes
ALTER TABLE agentes ADD COLUMN IF NOT EXISTS usuario TEXT;
ALTER TABLE agentes ADD COLUMN IF NOT EXISTS clave TEXT;

-- 5. Añadir columna motivo en la tabla ferias
ALTER TABLE ferias ADD COLUMN IF NOT EXISTS motivo TEXT;
