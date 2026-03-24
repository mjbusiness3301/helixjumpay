import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: "admin" | "affiliate" | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "affiliate" | null>(null);
  const [loading, setLoading] = useState(true);

  const determineRole = async (userId: string) => {
    // Check if user is admin
    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminData) {
      setUserRole("admin");
      return;
    }

    // Check if user is affiliate
    const { data: affiliateData } = await supabase
      .from("affiliates")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (affiliateData) {
      setUserRole("affiliate");
      return;
    }

    setUserRole(null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await determineRole(session.user.id);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await determineRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        userRole,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
