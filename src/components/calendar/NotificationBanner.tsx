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
  const [confirmModal, setConfirmModal] = useState(false);
  const [errorLine, setErrorLine] = useState("");
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    loadNotification();
  }, []);

  useEffect(() => {
    if (!confirmModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmModal]);

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

  const handleSaveClick = () => {
    if (!editValue.trim()) return;
    setConfirmModal(true);
  };

  const executeSave = async () => {
    setSaving(true);
    setErrorLine("");
    try {
      await api.updateNotification(editValue);
      setMessage(editValue);
      setIsEditing(false);
      setConfirmModal(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err: any) {
      // IMPRIMIR EL ERROR MÁS DETALLADO POSIBLE EN LA CONSOLA PARA DEPURAR
      console.error("=== ERROR DETALLADO AL GUARDAR ===");
      console.dir(err);
      console.log(JSON.stringify(err, null, 2));
      
      setErrorLine("Error detectado. Por favor, abre la Consola (F12) para ver los detalles.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <>
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
                  onClick={handleSaveClick}
                  disabled={saving}
                  title="Guardar notificación"
                  className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <Check size={16} />
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

      {confirmModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !saving && setConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full outline outline-1 outline-slate-200 transform animate-in scale-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">¿Confirmar Actualización?</h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              ¿Deseas actualizar el mensaje de notificación público para que todo tu equipo lo vea?
            </p>
            
            {errorLine && (
              <div className="bg-red-50 text-red-600 p-2 text-xs rounded-md mb-4 border border-red-200">
                {errorLine}
              </div>
            )}

            <div className="flex justify-end gap-3 font-medium text-sm">
              <button 
                disabled={saving}
                onClick={() => setConfirmModal(false)}
                className="px-4 py-2 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                disabled={saving}
                onClick={executeSave}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                SÍ, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {successToast && (
        <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 bg-green-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-6 fade-in duration-300 z-[110]">
          <Check size={18} />
          <span className="text-sm font-semibold">Notificación actualizada</span>
        </div>
      )}
    </>
  );
}
