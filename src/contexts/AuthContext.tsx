import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "../types";
import { api } from "../api/supabase";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
      const adminProfile: Profile = {
        id: currentUser.id,
        email: email,
        nombre: email.split('@')[0] || 'Admin',
        estado: 'aprobado',
        is_admin: true
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
            is_admin: true
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
        const newProf = {
          id: currentUser.id,
          email: email,
          nombre: email.split('@')[0] || 'Usuario',
          estado: 'pendiente' as const,
          is_admin: false
        };
        try { await supabase.from('perfiles').insert([newProf]); } catch {}
        prof = newProf as unknown as Profile;
      }

      setProfile(prof);
    } catch (e) {
      console.error("Error loading profile:", e);
      setProfile(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
