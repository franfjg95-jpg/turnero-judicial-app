import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "../types";
import { api } from "../api/supabase";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  currentAdminId: string | null;
  loginAsWorker: (username: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  currentAdminId: null,
  loginAsWorker: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const activeUserIdRef = useRef<string | null>(null);

  // Correos con acceso ADMIN garantizado — BYPASS TOTAL, sin consultar DB
  const ADMIN_EMAILS = [
    'franfjg95@gmail.com',
    'toledomariajulieta.mpf@gmail.com'
  ];

  const loadProfile = async (currentUser: User) => {
    const email = (currentUser.email || '').toLowerCase().trim();
    const isWhitelistedAdmin = ADMIN_EMAILS.includes(email);

    // ============ BYPASS TOTAL para admins whitelisted ============
    if (isWhitelistedAdmin) {
      try {
        const { data: dbProfile } = await supabase.from('perfiles').select('*').eq('id', currentUser.id).maybeSingle();
        if (dbProfile) {
          setProfile({
            ...dbProfile,
            estado: 'aprobado',
            is_admin: true
          });
          return;
        }
      } catch (err) {
        console.warn("No se pudo obtener el perfil de admin de la DB, usando fallback:", err);
      }

      const adminProfile: Profile = {
        id: currentUser.id,
        email: email,
        nombre: email.split('@')[0] || 'Admin',
        estado: 'aprobado',
        is_admin: true,
        admin_id: null
      } as Profile;
      setProfile(adminProfile);

      // Intentar sincronizar con DB en background (no bloqueante)
      (async () => {
        try {
          await supabase.from('perfiles').upsert({
            id: currentUser.id,
            email: email,
            nombre: email.split('@')[0] || 'Admin',
            estado: 'aprobado',
            is_admin: true,
            admin_id: null
          }, { onConflict: 'id' });
          console.log('Admin profile synced to DB');
        } catch {
          console.warn('Could not sync admin profile to DB (non-blocking)');
        }
      })();

      return; // SALIR INMEDIATAMENTE, no tocar más nada
    }

    // ============ Lógica normal para usuarios NO whitelisted ============
    try {
      let prof: Profile | null = null;

      try {
        prof = await api.auth.getProfile(currentUser.id);
      } catch {
        console.warn("Perfil no encontrado por ID");
      }

      if (!prof) {
        const { data: byEmail } = await supabase.from('perfiles').select('*').eq('email', email).maybeSingle();
        if (byEmail) {
          prof = byEmail;
        }
      }

      if (!prof) {
        // Leer metadatos de registro guardados al hacer SignUp
        const metadata = currentUser.user_metadata || {};
        const isRegisteredAsAdmin = metadata.is_admin === true;

        const newProf = {
          id: currentUser.id,
          email: email,
          nombre: metadata.nombre || email.split('@')[0] || 'Usuario',
          estado: isRegisteredAsAdmin ? 'aprobado' : 'pendiente',
          is_admin: isRegisteredAsAdmin,
          admin_id: null
        };
        try { 
          await supabase.from('perfiles').insert([newProf]); 
        } catch (e) {
          console.error("No se pudo insertar el perfil en el primer ingreso:", e);
        }
        prof = newProf as unknown as Profile;
      }

      setProfile(prof);
    } catch (e) {
      console.error("Error loading profile:", e);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 1. Ver si hay sesión virtual de trabajador en localStorage
    const storedWorkerAdminId = localStorage.getItem("turnero_worker_admin_id");
    const storedWorkerUsername = localStorage.getItem("turnero_worker_username");
    const storedWorkerName = localStorage.getItem("turnero_worker_name");

    if (storedWorkerAdminId && storedWorkerUsername) {
      const virtualId = `worker-${storedWorkerAdminId}`;
      activeUserIdRef.current = virtualId;
      setUser({ email: `${storedWorkerUsername}@turnerouj.local`, id: virtualId } as any);
      setProfile({
        id: virtualId,
        email: `${storedWorkerUsername}@turnerouj.local`,
        nombre: storedWorkerName || "Sumariante (Lectura)",
        estado: 'aprobado',
        is_admin: false,
        admin_id: storedWorkerAdminId,
        created_at: new Date().toISOString()
      });
      setLoading(false);
      return;
    }

    // 2. Si no hay sesión virtual, cargar la sesión de Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      activeUserIdRef.current = currentUser?.id ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      
      // Omitir si es el mismo usuario ya cargado (ej. por enfoque de pestaña o refresco de token)
      if (currentUser?.id && currentUser.id === activeUserIdRef.current) {
        return;
      }
      
      activeUserIdRef.current = currentUser?.id ?? null;

      if (session) {
        localStorage.removeItem("turnero_worker_admin_id");
        localStorage.removeItem("turnero_worker_username");
        localStorage.removeItem("turnero_worker_name");
      }

      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        loadProfile(currentUser).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsWorker = async (username: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agentes')
        .select('*')
        .eq('usuario', username)
        .eq('clave', password)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error("Usuario o clave incorrecta.");
      }

      // Establecer sesión virtual
      localStorage.setItem("turnero_worker_admin_id", data.admin_id);
      localStorage.setItem("turnero_worker_username", username);
      localStorage.setItem("turnero_worker_name", data.nombre);
      
      setUser({ email: `${username}@turnerouj.local`, id: `worker-${data.admin_id}` } as any);
      setProfile({
        id: `worker-${data.admin_id}`,
        email: `${username}@turnerouj.local`,
        nombre: data.nombre,
        estado: 'aprobado',
        is_admin: false,
        admin_id: data.admin_id,
        created_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem("turnero_worker_admin_id");
    localStorage.removeItem("turnero_worker_username");
    localStorage.removeItem("turnero_worker_name");
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const currentAdminId = profile 
    ? (profile.is_admin ? profile.id : (profile.admin_id ?? null))
    : null;

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, currentAdminId, loginAsWorker }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
