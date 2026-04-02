"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { MealSettings, Mess } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import { Settings, UtensilsCrossed, Sun, Sunset, Moon, Save, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsClient() {
  const { member: currentMember } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mess, setMess] = useState<Mess | null>(null);
  const [settings, setSettings] = useState<MealSettings | null>(null);

  // Form state
  const [messName, setMessName] = useState("");
  const [morningValue, setMorningValue] = useState("0.5");
  const [lunchValue, setLunchValue] = useState("1");
  const [dinnerValue, setDinnerValue] = useState("1");

  const supabase = createClient();
  const messId = currentMember?.mess_id;

  const fetchData = useCallback(async () => {
    if (!messId) return;
    setLoading(true);
    const [messRes, settingsRes] = await Promise.all([
      supabase.from("messes").select("*").eq("id", messId).single(),
      supabase.from("meal_settings").select("*").eq("mess_id", messId).maybeSingle(),
    ]);
    if (messRes.data) {
      setMess(messRes.data);
      setMessName(messRes.data.name);
    }
    if (settingsRes.data) {
      setSettings(settingsRes.data);
      setMorningValue(String(settingsRes.data.morning_value));
      setLunchValue(String(settingsRes.data.lunch_value));
      setDinnerValue(String(settingsRes.data.dinner_value));
    }
    setLoading(false);
  }, [messId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveSettings = async () => {
    if (!messId) return;
    const mv = parseFloat(morningValue);
    const lv = parseFloat(lunchValue);
    const dv = parseFloat(dinnerValue);

    if (isNaN(mv) || isNaN(lv) || isNaN(dv) || mv < 0 || lv < 0 || dv < 0) {
      toast.error("All meal values must be valid positive numbers");
      return;
    }
    if (!messName.trim()) { toast.error("Mess name is required"); return; }

    setSaving(true);
    try {
      // Update mess name
      const { error: messError } = await supabase
        .from("messes")
        .update({ name: messName.trim() })
        .eq("id", messId);
      if (messError) throw messError;

      // Upsert meal settings
      const { error: settingsError } = await supabase
        .from("meal_settings")
        .upsert({
          mess_id: messId,
          morning_value: mv,
          lunch_value: lv,
          dinner_value: dv,
          updated_at: new Date().toISOString(),
        }, { onConflict: "mess_id" });
      if (settingsError) throw settingsError;

      toast.success("Settings saved!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const total = (parseFloat(morningValue) || 0) + (parseFloat(lunchValue) || 0) + (parseFloat(dinnerValue) || 0);

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Mess Settings</h1>
        <p className="text-sm text-ink-400 mt-0.5">Configure your mess name and meal values</p>
      </div>

      {/* Mess name */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} className="text-ink-400" />
          <h2 className="font-semibold text-ink-900 text-sm">General</h2>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1.5">Mess Name</label>
          <input
            type="text"
            value={messName}
            onChange={(e) => setMessName(e.target.value)}
            placeholder="e.g. Bismillah Mess"
            className="input"
          />
        </div>
      </div>

      {/* Meal values */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-1">
          <UtensilsCrossed size={16} className="text-ink-400" />
          <h2 className="font-semibold text-ink-900 text-sm">Meal Values</h2>
        </div>
        <p className="text-xs text-ink-400 mb-5">
          Set the numeric value for each meal type. These are fixed and used to calculate each member's total meals.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Changing meal values will affect calculations for the entire month retroactively. Only change these at the start of a new month.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Morning", icon: Sun, color: "text-orange-500", bg: "bg-orange-50", val: morningValue, set: setMorningValue },
            { label: "Lunch", icon: Sunset, color: "text-blue-500", bg: "bg-blue-50", val: lunchValue, set: setLunchValue },
            { label: "Dinner", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50", val: dinnerValue, set: setDinnerValue },
          ].map(({ label, icon: Icon, color, bg, val, set }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Icon size={13} className={color} />
                  {label}
                </span>
              </label>
              <div className={`relative rounded-xl border-2 border-surface-200 focus-within:border-brand-400 overflow-hidden ${bg}`}>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  step="0.25"
                  min="0"
                  max="5"
                  className="w-full px-3 py-2.5 bg-transparent text-center text-lg font-semibold text-ink-900 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-brand-50 rounded-xl">
          <p className="text-xs text-brand-700 text-center">
            Maximum meals per day per member: <strong>{total > 0 ? total.toFixed(2) : "0"}</strong> units (if all 3 meals taken)
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="card p-6">
        <h2 className="font-semibold text-ink-900 text-sm mb-4">Example Calculation Preview</h2>
        <div className="overflow-x-auto">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>Morning</th>
                <th>Lunch</th>
                <th>Dinner</th>
                <th>Total Meals</th>
              </tr>
            </thead>
            <tbody>
              {[
                [true, true, true],
                [false, true, true],
                [true, false, true],
                [false, false, true],
                [true, true, false],
              ].map((combo, i) => {
                const val = (combo[0] ? parseFloat(morningValue) || 0 : 0) +
                  (combo[1] ? parseFloat(lunchValue) || 0 : 0) +
                  (combo[2] ? parseFloat(dinnerValue) || 0 : 0);
                return (
                  <tr key={i}>
                    <td className="text-center">{combo[0] ? "✓" : "—"}</td>
                    <td className="text-center">{combo[1] ? "✓" : "—"}</td>
                    <td className="text-center">{combo[2] ? "✓" : "—"}</td>
                    <td className="text-center font-semibold text-brand-700">{val.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={saveSettings} disabled={saving} className="btn-primary px-8">
          {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
