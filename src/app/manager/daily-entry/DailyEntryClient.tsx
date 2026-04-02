"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { MessMember, MealSettings, DailyMeal, DailyCost } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { UtensilsCrossed, ShoppingCart, Save, Plus, Trash2, Sun, Sunset, Moon } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface MealRow {
  memberId: string;
  morning: boolean;
  lunch: boolean;
  dinner: boolean;
}

export default function DailyEntryClient() {
  const { member: currentMember } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [members, setMembers] = useState<MessMember[]>([]);
  const [settings, setSettings] = useState<MealSettings | null>(null);
  const [mealRows, setMealRows] = useState<MealRow[]>([]);
  const [existingMeals, setExistingMeals] = useState<DailyMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bazar cost state
  const [costs, setCosts] = useState<DailyCost[]>([]);
  const [newCostAmount, setNewCostAmount] = useState("");
  const [newCostNote, setNewCostNote] = useState("");
  const [addingCost, setAddingCost] = useState(false);

  const supabase = createClient();
  const messId = currentMember?.mess_id;

  const fetchData = useCallback(async () => {
    if (!messId) return;
    setLoading(true);

    const [membersRes, settingsRes, mealsRes, costsRes] = await Promise.all([
      supabase.from("mess_members").select("*").eq("mess_id", messId).eq("is_active", true).order("name"),
      supabase.from("meal_settings").select("*").eq("mess_id", messId).maybeSingle(),
      supabase.from("daily_meals").select("*").eq("mess_id", messId).eq("date", selectedDate),
      supabase.from("daily_costs").select("*").eq("mess_id", messId).eq("date", selectedDate).order("created_at"),
    ]);

    const mems = membersRes.data ?? [];
    const existingMealsData = mealsRes.data ?? [];

    setMembers(mems);
    setSettings(settingsRes.data);
    setExistingMeals(existingMealsData);
    setCosts(costsRes.data ?? []);

    // Build meal rows from existing or defaults
    const rows: MealRow[] = mems.map((m) => {
      const existing = existingMealsData.find((e) => e.member_id === m.id);
      return {
        memberId: m.id,
        morning: existing?.took_morning ?? false,
        lunch: existing?.took_lunch ?? false,
        dinner: existing?.took_dinner ?? false,
      };
    });
    setMealRows(rows);
    setLoading(false);
  }, [messId, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleAll = (field: "morning" | "lunch" | "dinner", value: boolean) => {
    setMealRows((rows) => rows.map((r) => ({ ...r, [field]: value })));
  };

  const toggleRow = (memberId: string, field: "morning" | "lunch" | "dinner") => {
    setMealRows((rows) =>
      rows.map((r) => r.memberId === memberId ? { ...r, [field]: !r[field] } : r)
    );
  };

  const saveMeals = async () => {
    if (!messId || !currentMember) return;
    setSaving(true);

    try {
      // Upsert all meal rows
      const upsertData = mealRows.map((row) => ({
        mess_id: messId,
        member_id: row.memberId,
        date: selectedDate,
        took_morning: row.morning,
        took_lunch: row.lunch,
        took_dinner: row.dinner,
        created_by: null,
      }));

      const { error } = await supabase
        .from("daily_meals")
        .upsert(upsertData, { onConflict: "mess_id,member_id,date" });

      if (error) throw error;
      toast.success("Meals saved successfully!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save meals");
    } finally {
      setSaving(false);
    }
  };

  const addCost = async () => {
    if (!messId || !currentMember || !newCostAmount) return;
    const amount = parseFloat(newCostAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setAddingCost(true);
    try {
      const { error } = await supabase.from("daily_costs").insert({
        mess_id: messId,
        date: selectedDate,
        amount,
        note: newCostNote || null,
        created_by: null,
      });
      if (error) throw error;
      setNewCostAmount("");
      setNewCostNote("");
      toast.success("Cost added!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add cost");
    } finally {
      setAddingCost(false);
    }
  };

  const deleteCost = async (id: string) => {
    const { error } = await supabase.from("daily_costs").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchData(); }
  };

  const calcMealValue = (row: MealRow) => {
    if (!settings) return 0;
    let v = 0;
    if (row.morning) v += settings.morning_value;
    if (row.lunch) v += settings.lunch_value;
    if (row.dinner) v += settings.dinner_value;
    return v;
  };

  const totalDayCost = costs.reduce((s, c) => s + Number(c.amount), 0);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Daily Meal Entry</h1>
          <p className="text-sm text-ink-400 mt-0.5">Mark meals and add bazar costs</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          max={format(new Date(), "yyyy-MM-dd")}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input w-auto"
        />
      </div>

      {!settings ? (
        <div className="card p-8 text-center">
          <p className="text-ink-500">Please configure meal settings first.</p>
        </div>
      ) : members.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No active members" description="Add members from the Members page" />
      ) : (
        <>
          {/* Meal entry table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-ink-400" />
                <h2 className="font-semibold text-ink-900 text-sm">
                  Meals — {formatDate(selectedDate)}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <span className="hidden sm:inline">
                  M={settings.morning_value} · L={settings.lunch_value} · D={settings.dinner_value}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <Sun size={14} className="text-orange-400" />
                        <span>Morning ({settings.morning_value})</span>
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => toggleAll("morning", true)} className="text-[10px] text-brand-600 hover:underline">All</button>
                          <span className="text-ink-200">|</span>
                          <button onClick={() => toggleAll("morning", false)} className="text-[10px] text-ink-400 hover:underline">None</button>
                        </div>
                      </div>
                    </th>
                    <th className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <Sunset size={14} className="text-blue-400" />
                        <span>Lunch ({settings.lunch_value})</span>
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => toggleAll("lunch", true)} className="text-[10px] text-brand-600 hover:underline">All</button>
                          <span className="text-ink-200">|</span>
                          <button onClick={() => toggleAll("lunch", false)} className="text-[10px] text-ink-400 hover:underline">None</button>
                        </div>
                      </div>
                    </th>
                    <th className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <Moon size={14} className="text-indigo-400" />
                        <span>Dinner ({settings.dinner_value})</span>
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => toggleAll("dinner", true)} className="text-[10px] text-brand-600 hover:underline">All</button>
                          <span className="text-ink-200">|</span>
                          <button onClick={() => toggleAll("dinner", false)} className="text-[10px] text-ink-400 hover:underline">None</button>
                        </div>
                      </div>
                    </th>
                    <th className="text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {mealRows.map((row, idx) => {
                    const mem = members.find((m) => m.id === row.memberId)!;
                    const val = calcMealValue(row);
                    return (
                      <tr key={row.memberId}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-brand-700">{mem.name[0]}</span>
                            </div>
                            <span className="font-medium text-ink-900 text-sm">{mem.name}</span>
                          </div>
                        </td>
                        {(["morning", "lunch", "dinner"] as const).map((field) => (
                          <td key={field} className="text-center">
                            <input
                              type="checkbox"
                              checked={row[field]}
                              onChange={() => toggleRow(row.memberId, field)}
                              className="meal-checkbox"
                            />
                          </td>
                        ))}
                        <td className="text-center">
                          <span className={`font-semibold text-sm ${val > 0 ? "text-brand-700" : "text-ink-300"}`}>
                            {val.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-surface-100 flex justify-end">
              <button
                onClick={saveMeals}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving…" : "Save Meals"}
              </button>
            </div>
          </div>

          {/* Bazar cost section */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-ink-400" />
                <h2 className="font-semibold text-ink-900 text-sm">Bazar Cost — {formatDate(selectedDate)}</h2>
              </div>
              {totalDayCost > 0 && (
                <span className="text-sm font-semibold text-ink-900">
                  Total: ৳{formatCurrency(totalDayCost)}
                </span>
              )}
            </div>

            {/* Add cost form */}
            <div className="px-5 py-4 bg-surface-50 border-b border-surface-100">
              <div className="flex gap-3 flex-wrap items-end">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Amount (৳)</label>
                  <input
                    type="number"
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input"
                  />
                </div>
                <div className="flex-[2] min-w-[160px]">
                  <label className="block text-xs font-medium text-ink-500 mb-1.5">Note (optional)</label>
                  <input
                    type="text"
                    value={newCostNote}
                    onChange={(e) => setNewCostNote(e.target.value)}
                    placeholder="e.g. Vegetables, fish..."
                    className="input"
                  />
                </div>
                <button
                  onClick={addCost}
                  disabled={addingCost || !newCostAmount}
                  className="btn-primary h-[42px]"
                >
                  <Plus size={16} />
                  {addingCost ? "Adding…" : "Add"}
                </button>
              </div>
            </div>

            {/* Cost list */}
            {costs.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="No costs added" description="Add bazar expenses above" />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Note</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.map((cost) => (
                      <tr key={cost.id}>
                        <td className="font-semibold text-ink-900">৳{formatCurrency(cost.amount)}</td>
                        <td className="text-ink-500">{cost.note ?? "—"}</td>
                        <td className="text-right">
                          <button
                            onClick={() => deleteCost(cost.id)}
                            className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
