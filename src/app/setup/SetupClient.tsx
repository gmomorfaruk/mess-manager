"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UtensilsCrossed, Plus, Users, ArrowRight, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { User } from "@supabase/supabase-js";

type Step = "choose" | "create" | "wait" | "done";

export default function SetupClient() {
  const [step, setStep] = useState<Step>("choose");
  const [user, setUser] = useState<User | null>(null);
  const [messName, setMessName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.user_metadata?.full_name) {
        setMemberName(user.user_metadata.full_name);
      }
    });
  }, []);

  // Check if user now has a member record (in case admin just linked them)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!user) return;
      const { data } = await supabase
        .from("mess_members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        clearInterval(interval);
        router.push("/dashboard");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const createMess = async () => {
    if (!messName.trim() || !memberName.trim() || !user) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      // 1. Create mess
      const { data: mess, error: messError } = await supabase
        .from("messes")
        .insert({ name: messName.trim(), created_by: user.id })
        .select()
        .single();
      if (messError) throw messError;

      // 2. Add creator as admin member
      const { error: memberError } = await supabase.from("mess_members").insert({
        mess_id: mess.id,
        user_id: user.id,
        name: memberName.trim(),
        email: user.email,
        role: "admin",
        is_active: true,
      });
      if (memberError) throw memberError;

      // 3. Create default meal settings
      await supabase.from("meal_settings").insert({
        mess_id: mess.id,
        morning_value: 0.5,
        lunch_value: 1.0,
        dinner_value: 1.0,
      });

      toast.success("Mess created! Welcome, Admin.");
      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create mess");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
        <div className="text-center animate-slide-up">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="text-2xl font-semibold text-ink-900 mb-2">All set!</h2>
          <p className="text-ink-500">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-surface-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-100 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative w-full max-w-lg animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl shadow-lg mb-4">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-3xl text-ink-900">Get Started</h1>
          <p className="text-ink-500 text-sm mt-1">Set up your mess or wait for an invite</p>
        </div>

        {step === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("create")}
              className="w-full card p-5 flex items-center gap-4 hover:shadow-card-md transition-all duration-150 hover:border-brand-200 text-left group"
            >
              <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
                <Plus className="w-5 h-5 text-brand-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-900">Create a new mess</p>
                <p className="text-sm text-ink-400 mt-0.5">Start fresh as admin — invite members later</p>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-brand-500 transition-colors" />
            </button>

            <button
              onClick={() => setStep("wait")}
              className="w-full card p-5 flex items-center gap-4 hover:shadow-card-md transition-all duration-150 hover:border-surface-200 text-left group"
            >
              <div className="w-11 h-11 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-surface-200 transition-colors">
                <Users className="w-5 h-5 text-ink-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink-900">Join an existing mess</p>
                <p className="text-sm text-ink-400 mt-0.5">Your admin will link your account</p>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
            </button>
          </div>
        )}

        {step === "create" && (
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-ink-900 mb-0.5">Create Your Mess</h2>
              <p className="text-sm text-ink-400">You'll be the admin with full control</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">Mess Name *</label>
              <input
                type="text"
                value={messName}
                onChange={(e) => setMessName(e.target.value)}
                placeholder="e.g. Bismillah Mess, Block-C Mess"
                className="input"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">Your Name *</label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Your full name"
                className="input"
              />
            </div>

            <div className="p-3 bg-brand-50 rounded-xl">
              <p className="text-xs text-brand-700">
                Default meal values will be set: Morning=0.5, Lunch=1, Dinner=1. You can change these in Settings.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep("choose")} className="btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={createMess}
                disabled={loading || !messName.trim() || !memberName.trim()}
                className="btn-primary flex-1"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Plus size={16} />}
                {loading ? "Creating…" : "Create Mess"}
              </button>
            </div>
          </div>
        )}

        {step === "wait" && (
          <div className="card p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-ink-400" />
            </div>
            <div>
              <h2 className="font-semibold text-ink-900 mb-1">Waiting for your admin</h2>
              <p className="text-sm text-ink-500 leading-relaxed">
                Share your email with your mess admin:<br />
                <span className="font-medium text-ink-700 mt-1 inline-block bg-surface-100 px-3 py-1 rounded-lg text-xs">
                  {user?.email}
                </span>
              </p>
            </div>
            <div className="p-3 bg-brand-50 rounded-xl">
              <p className="text-xs text-brand-700">
                Once your admin adds you with this email and links your account, this page will redirect automatically.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-ink-400">
              <div className="w-3 h-3 border-2 border-ink-200 border-t-brand-500 rounded-full animate-spin" />
              Checking every 5 seconds…
            </div>
            <button onClick={() => setStep("choose")} className="btn-ghost text-sm">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
