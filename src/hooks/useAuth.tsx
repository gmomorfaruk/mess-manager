"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { MessMember } from "@/types";

interface AuthContextType {
  user: User | null;
  member: MessMember | null;
  loading: boolean;
  refreshMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  member: null,
  loading: true,
  refreshMember: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<MessMember | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMember = async (userId: string) => {
    const { data, error } = await supabase
      .from("mess_members")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setMember(null);
      return;
    }

    setMember(data ?? null);
  };

  const refreshMember = async () => {
    if (user) await fetchMember(user.id);
  };

  useEffect(() => {
    const failsafe = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const init = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);

        if (user) {
          fetchMember(user.id);
        } else {
          setMember(null);
        }
      } finally {
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMember(session.user.id);
      } else {
        setMember(null);
      }
    });

    return () => {
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, member, loading, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
