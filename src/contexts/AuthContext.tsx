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

  // Correos con acceso ADMIN garantizado
  const ADMIN_EMAILS = [
    'franfjg95@gmail.com',
    'toledomariajulieta.mpf@gmail.com'
  ];

  const loadProfile = async (currentUser: User) => {
    const email = currentUser.email || '';
    const isWhitelistedAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    try {
      let prof: Profile | null = null;

      // 1. Intentar cargar por ID
      try {
        prof = await api.auth.getProfile(currentUser.id);
      } catch (err) {
        console.warn("No se encontró perfil por ID, buscando por email...");
      }

      // 2. Si no se encontró por ID, buscar por email
      if (!prof) {
        const { data: byEmail } = await supabase.from('perfiles').select('*').eq('email', email).maybeSingle();
        if (byEmail) {
          prof = byEmail;
          // Corregir ID silenciosamente
          try { await supabase.from('perfiles').update({ id: currentUser.id }).eq('email', email); } catch {}
        }
      }

      // 3. Si aún no existe, auto-crear perfil
      if (!prof) {
        const newProf = {
          id: currentUser.id,
          email: email,
          nombre: email.split('@')[0] || 'Usuario',
          estado: 'aprobado' as const,
          is_admin: isWhitelistedAdmin
        };
        try { await supabase.from('perfiles').insert([newProf]); } catch {}
        prof = newProf as unknown as Profile;
      }

      // 4. Si es un admin whitelisted, forzar estado y rol sin importar lo que diga la DB
      if (isWhitelistedAdmin && prof) {
        if (prof.estado !== 'aprobado' || !prof.is_admin) {
          prof = { ...prof, estado: 'aprobado', is_admin: true };
          try {
            await supabase.from('perfiles')
              .update({ estado: 'aprobado', is_admin: true })
              .eq('id', currentUser.id);
          } catch {}
        }
      }

      setProfile(prof);
    } catch (e) {
      console.error("Error loading profile:", e);
      // Fallback de emergencia para admins whitelisted
      if (isWhitelistedAdmin) {
        setProfile({
          id: currentUser.id,
          email: email,
          nombre: email.split('@')[0] || 'Admin',
          estado: 'aprobado',
          is_admin: true
        } as Profile);
      } else {
        setProfile(null);
      }
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
