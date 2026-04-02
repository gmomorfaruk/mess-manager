"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessMember } from "@/types";
import {
  clearLocalSession,
  getSessionStorageKey,
  readLocalSession,
  type LocalSession,
} from "@/lib/localSession";

interface LocalUser {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: LocalUser | null;
  member: MessMember | null;
  loading: boolean;
  refreshMember: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  member: null,
  loading: true,
  refreshMember: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [member, setMember] = useState<MessMember | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const resolveMember = async (session: LocalSession) => {
    const email = session.email.trim().toLowerCase();

    if (email) {
      const { data, error } = await supabase
        .from("mess_members")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .order("joined_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setMember(data);
        return;
      }
    }

    const { data } = await supabase
      .from("mess_members")
      .select("*")
      .eq("name", session.name)
      .eq("is_active", true)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setMember(data ?? null);
  };

  const loadFromSession = async () => {
    setLoading(true);
    const session = readLocalSession();

    if (!session) {
      setUser(null);
      setMember(null);
      setLoading(false);
      return;
    }

    setUser({
      id: session.id,
      email: session.email,
      full_name: session.name,
    });

    await resolveMember(session);
    setLoading(false);
  };

  const refreshMember = async () => {
    const session = readLocalSession();
    if (!session) {
      setMember(null);
      return;
    }
    await resolveMember(session);
  };

  const signOut = () => {
    clearLocalSession();
    setUser(null);
    setMember(null);
  };

  useEffect(() => {
    loadFromSession();

    const onStorage = (event: StorageEvent) => {
      if (event.key === getSessionStorageKey()) {
        loadFromSession();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, member, loading, refreshMember, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
