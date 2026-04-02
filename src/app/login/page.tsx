"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UtensilsCrossed } from "lucide-react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
  }, [router, supabase.auth]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;
    } catch (err: any) {
      const message = String(err?.message ?? "Something went wrong");
      if (message.toLowerCase().includes("unsupported provider")) {
        setError("Google sign-in is not enabled in Supabase yet. Use email login below.");
      } else {
        setError(message);
      }
      setGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    setError(null);
    setSent(false);

    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before requesting another email.`);
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setEmailLoading(true);

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
      setCooldown(60);
    } catch (err: any) {
      const message = String(err?.message ?? "Something went wrong");
      if (message.toLowerCase().includes("rate limit")) {
        setError("Too many email requests. Wait 60 seconds, then try once.");
        setCooldown(60);
      } else {
        setError(message);
      }
    } finally {
      setEmailLoading(false);
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
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || emailLoading}
            className="w-full h-12 rounded-xl border border-surface-300 bg-white hover:bg-surface-50 text-ink-800 font-semibold text-sm flex items-center justify-center gap-3 transition disabled:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.2 8.7 3.2l6.5-6.5C35.4 2.6 30 0 24 0 14.6 0 6.4 5.4 2.4 13.3l7.6 5.9C11.9 13.2 17.4 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.3 1.9-1.8 4.7-5.1 6.6l7.8 6.1c4.5-4.2 6.7-10.3 6.7-16.4z" />
              <path fill="#FBBC05" d="M10 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6l-7.6-5.9C.9 16.7 0 20.2 0 24s.9 7.3 2.4 10.5l7.6-5.9z" />
              <path fill="#34A853" d="M24 48c6 0 11-2 14.6-5.4l-7.8-6.1c-2.1 1.4-4.9 2.4-8.8 2.4-6.6 0-12.1-3.7-14-9.1l-7.6 5.9C6.4 42.6 14.6 48 24 48z" />
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-surface-200 flex-1" />
            <span className="text-xs text-ink-400">or use email link</span>
            <div className="h-px bg-surface-200 flex-1" />
          </div>

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
            disabled={emailLoading || googleLoading || cooldown > 0}
            className="w-full btn-primary h-12 text-sm font-semibold"
          >
            {emailLoading ? "Sending link..." : cooldown > 0 ? `Try again in ${cooldown}s` : "Continue with Email"}
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
