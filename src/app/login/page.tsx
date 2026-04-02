"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UtensilsCrossed } from "lucide-react";
import { generateLocalUserId, writeLocalSession } from "@/lib/localSession";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const sessionRaw = window.localStorage.getItem("mess_manager_session_v1");
    if (!sessionRaw) return;

    try {
      const session = JSON.parse(sessionRaw);
      if (session?.email) router.replace("/dashboard");
    } catch {
      window.localStorage.removeItem("mess_manager_session_v1");
    }
  }, [router]);

  const handleContinue = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      writeLocalSession({
        id: generateLocalUserId(),
        name: name.trim(),
        email: cleanEmail,
      });

      const { data, error: memberError } = await supabase
        .from("mess_members")
        .select("id")
        .eq("email", cleanEmail)
        .eq("is_active", true)
        .maybeSingle();

      if (memberError) {
        router.push("/setup");
        return;
      }

      router.push(data ? "/dashboard" : "/setup");
    } catch {
      router.push("/setup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-surface-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-50 rounded-full blur-3xl opacity-80" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl shadow-lg mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl text-ink-900 mb-1">MessManager</h1>
          <p className="text-ink-500 text-sm leading-relaxed">
            Enter your name and email to continue.
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Your name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Faruk"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </div>

          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full btn-primary h-12 text-sm font-semibold"
          >
            {loading ? "Please wait..." : "Continue"}
          </button>

          <p className="text-xs text-ink-400 text-center leading-relaxed">
            New users will set up their mess after sign in. Existing members go straight to dashboard.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
