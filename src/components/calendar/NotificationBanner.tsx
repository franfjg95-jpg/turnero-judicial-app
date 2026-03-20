import { useState, useEffect } from "react";
import { Bell, Edit2, Check, Loader2 } from "lucide-react";
import { api } from "../../api/supabase";
import { useAuth } from "../../contexts/AuthContext";

export function NotificationBanner() {
  const { user } = useAuth();
  const isAdmin = !!user;

  const [message, setMessage] = useState("Cargando notificaciones...");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotification();
  }, []);

  const loadNotification = async () => {
    try {
      const data = await api.getNotification();
      if (data && data.mensaje) {
        setMessage(data.mensaje);
        setEditValue(data.mensaje);
      } else {
        setMessage("No hay avisos importantes en este momento.");
        setEditValue("No hay avisos importantes en este momento.");
      }
    } catch (err) {
      console.error(err);
      setMessage("No se ha configurado la notificación pública aún.");
      setEditValue("");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await api.updateNotification(editValue);
      setMessage(editValue);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Error al guardar la notificación. Verifica tus permisos y la base de datos.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 flex items-start sm:items-center gap-3 shadow-sm mb-2 transition-all">
      <div className="bg-green-100 p-2 rounded-lg text-green-700 shrink-0">
        <Bell size={20} />
      </div>
      
      <div className="flex-1 w-full">
        {isEditing && isAdmin ? (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <textarea
              className="flex-1 w-full text-sm bg-white border border-green-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-green-900 resize-none shadow-inner"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={2}
              autoFocus
            />
            <div className="flex sm:flex-col gap-2 shrink-0">
               <button
                 onClick={handleSave}
                 disabled={saving}
                 title="Guardar notificación"
                 className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
               >
                 {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                 <span className="sm:hidden">Guardar</span>
               </button>
               <button
                 onClick={() => { setIsEditing(false); setEditValue(message); }}
                 disabled={saving}
                 className="flex items-center justify-center px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 rounded-md transition-colors"
               >
                 Cancelar
               </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="text-[13px] sm:text-sm text-green-800 flex-1 leading-relaxed">
              <strong className="font-bold text-green-900 mr-2">Notificación:</strong>
              {message}
            </div>
            
            {isAdmin && (
              <button
                onClick={() => setIsEditing(true)}
                className="shrink-0 p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-md transition-colors border border-transparent hover:border-green-200"
                title="Editar aviso"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
