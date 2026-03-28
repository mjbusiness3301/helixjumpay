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

  const checkFrozen = async (userId: string): Promise<boolean> => {
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    if (affiliate?.status === "frozen") return true;

    const { data: admin } = await supabase
      .from("admins")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    if (admin?.status === "frozen") return true;

    return false;
  };

  const determineRole = async (userId: string) => {
    try {
      const frozen = await checkFrozen(userId);
      if (frozen) {
        await supabase.auth.signOut();
        return null;
      }

      const { data: adminData } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (adminData) return "admin" as const;

      const { data: affiliateData } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (affiliateData) return "affiliate" as const;
    } catch {
      // Ignore errors
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);

        if (newSession?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(async () => {
            if (!mounted) return;
            const role = await determineRole(newSession.user.id);
            if (mounted) {
              setUserRole(role);
              setLoading(false);
            }
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);

      if (initialSession?.user) {
        const role = await determineRole(initialSession.user.id);
        if (mounted) {
          setUserRole(role);
        }
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
