"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UtensilsCrossed } from "lucide-react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, [router, supabase.auth]);

  const handleEmailSignIn = async () => {
    setError(null);
    setSent(false);

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
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (authError) throw authError;

      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
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
            Enter your name and email. We will send a secure sign-in link.
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
            onClick={handleEmailSignIn}
            disabled={loading}
            className="w-full btn-primary h-12 text-sm font-semibold"
          >
            {loading ? "Sending link..." : "Continue"}
          </button>

          {sent && (
            <div className="p-3 bg-brand-50 border border-brand-100 text-brand-700 rounded-lg text-sm">
              Check your email inbox and open the sign-in link.
            </div>
          )}

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
