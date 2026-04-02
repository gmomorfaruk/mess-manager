"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import {
  calculateMonthlyStats, formatCurrency, getCurrentMonth,
  getMonthRange, getMonthLabel,
} from "@/lib/utils";
import type { MessMember, MealSettings, DailyMeal, DailyCost, Deposit } from "@/types";
import StatCard from "@/components/ui/StatCard";
import MonthPicker from "@/components/ui/MonthPicker";
import BalanceBadge from "@/components/ui/BalanceBadge";
import { PageLoader } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import {
  BarChart3, ShoppingCart, UtensilsCrossed,
  TrendingUp, Wallet, Printer,
} from "lucide-react";

export default function SummaryClient() {
  const { member: currentMember, loading: authLoading } = useAuth();
  const [{ year, month }, setYearMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MessMember[]>([]);
  const [settings, setSettings] = useState<MealSettings | null>(null);
  const [meals, setMeals] = useState<DailyMeal[]>([]);
  const [costs, setCosts] = useState<DailyCost[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  const supabase = createClient();
  const messId = currentMember?.mess_id;

  const fetchData = useCallback(async () => {
    if (!messId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { start, end } = getMonthRange(year, month);
    try {
      const [membersRes, settingsRes, mealsRes, costsRes, depositsRes] = await Promise.all([
        supabase.from("mess_members").select("*").eq("mess_id", messId).eq("is_active", true).order("name"),
        supabase.from("meal_settings").select("*").eq("mess_id", messId).maybeSingle(),
        supabase.from("daily_meals").select("*").eq("mess_id", messId).gte("date", start).lte("date", end),
        supabase.from("daily_costs").select("*").eq("mess_id", messId).gte("date", start).lte("date", end),
        supabase.from("deposits").select("*").eq("mess_id", messId).gte("date", start).lte("date", end),
      ]);

      const firstError = membersRes.error ?? settingsRes.error ?? mealsRes.error ?? costsRes.error ?? depositsRes.error;
      if (firstError) throw firstError;

      setMembers(membersRes.data ?? []);
      setSettings(settingsRes.data);
      setMeals(mealsRes.data ?? []);
      setCosts(costsRes.data ?? []);
      setDeposits(depositsRes.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }, [messId, year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (authLoading) return <PageLoader />;

  if (!currentMember) {
    return (
      <div className="card p-8 text-center">
        <p className="text-ink-500">Could not find your active mess membership.</p>
      </div>
    );
  }

  const stats = settings
    ? calculateMonthlyStats(members, meals, costs, deposits, settings)
    : null;

  // For member role, filter to only their own summary
  const isMember = currentMember?.role === "member";
  const summaries = stats
    ? isMember
      ? stats.memberSummaries.filter((s) => s.member.user_id === currentMember?.user_id)
      : stats.memberSummaries
    : [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Monthly Summary</h1>
          <p className="text-sm text-ink-400 mt-0.5">{getMonthLabel(year, month)}</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker year={year} month={month} onChange={(y, m) => setYearMonth({ year: y, month: m })} />
          <button
            onClick={() => window.print()}
            className="btn-secondary no-print"
            title="Print summary"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-red-600 mb-3">{error}</p>
          <button onClick={fetchData} className="btn-secondary">Retry</button>
        </div>
      ) : !settings ? (
        <div className="card p-8 text-center">
          <p className="text-ink-500">Meal settings not configured. Please ask your admin.</p>
        </div>
      ) : (
        <>
          {/* Stats — hide for members */}
          {!isMember && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
              <StatCard label="Total Bazar Cost" value={`৳${formatCurrency(stats!.totalCost)}`} icon={ShoppingCart} iconBg="bg-orange-50" iconColor="text-orange-500" />
              <StatCard label="Total Meals" value={stats!.totalMeals.toFixed(2)} icon={UtensilsCrossed} />
              <StatCard label="Meal Rate" value={`৳${formatCurrency(stats!.mealRate)}`} sub="per meal unit" icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-500" />
              <StatCard label="Total Deposits" value={`৳${formatCurrency(stats!.totalDeposit)}`} icon={Wallet} iconBg="bg-purple-50" iconColor="text-purple-500" />
            </div>
          )}

          {/* Print header */}
          <div className="hidden print-only text-center mb-6">
            <h2 className="text-2xl font-bold">Mess Monthly Summary</h2>
            <p className="text-gray-600">{getMonthLabel(year, month)}</p>
            <div className="flex justify-center gap-8 mt-4 text-sm">
              <span>Total Cost: ৳{formatCurrency(stats!.totalCost)}</span>
              <span>Total Meals: {stats!.totalMeals.toFixed(2)}</span>
              <span>Meal Rate: ৳{formatCurrency(stats!.mealRate)}</span>
            </div>
          </div>

          {/* Summary table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
              <BarChart3 size={16} className="text-ink-400" />
              <h2 className="font-semibold text-ink-900 text-sm">
                {isMember ? "My Summary" : "Member Summary"}
              </h2>
              {!isMember && (
                <span className="badge bg-surface-100 text-ink-500 ml-auto">{summaries.length} members</span>
              )}
            </div>

            {summaries.length === 0 ? (
              <EmptyState icon={BarChart3} title="No data for this month" description="Data will appear once meals are entered" />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      {!isMember && <th>#</th>}
                      <th>Member</th>
                      <th className="text-right">Meals</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Cost</th>
                      <th className="text-right">Deposit</th>
                      <th className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map(({ member: m, totalMeals, mealRate, totalCost, totalDeposit, balance }, idx) => (
                      <tr key={m.id} className={isMember ? "bg-brand-50/30" : ""}>
                        {!isMember && (
                          <td className="text-ink-400 text-xs w-8">{idx + 1}</td>
                        )}
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-brand-700">{m.name[0]}</span>
                            </div>
                            <div>
                              <p className="font-medium text-ink-900">{m.name}</p>
                              <p className="text-xs text-ink-400 capitalize">{m.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right font-mono text-ink-700">{totalMeals.toFixed(2)}</td>
                        <td className="text-right text-ink-500 text-sm">৳{formatCurrency(mealRate)}</td>
                        <td className="text-right font-medium text-ink-900">৳{formatCurrency(totalCost)}</td>
                        <td className="text-right text-green-700 font-medium">৳{formatCurrency(totalDeposit)}</td>
                        <td className="text-right">
                          <BalanceBadge balance={balance} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {!isMember && (
                    <tfoot>
                      <tr className="bg-surface-50 font-semibold">
                        <td colSpan={2} className="px-4 py-3 text-sm text-ink-700">Total</td>
                        <td className="px-4 py-3 text-right font-mono text-ink-900">{stats!.totalMeals.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-ink-400">—</td>
                        <td className="px-4 py-3 text-right text-ink-900">৳{formatCurrency(stats!.totalCost)}</td>
                        <td className="px-4 py-3 text-right text-green-700">৳{formatCurrency(stats!.totalDeposit)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-ink-500">
                            Due: ৳{formatCurrency(stats!.totalDue)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* Meal rate info card */}
          <div className="card p-5 bg-gradient-to-r from-brand-50 to-white border-brand-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-brand-600 uppercase tracking-wide mb-1">
                  {getMonthLabel(year, month)} — Meal Rate
                </p>
                <p className="text-3xl font-semibold text-ink-900">
                  ৳{formatCurrency(stats!.mealRate)}
                  <span className="text-base font-normal text-ink-400 ml-1">/ meal unit</span>
                </p>
              </div>
              <div className="text-right sm:text-right">
                <p className="text-xs text-ink-400">Formula</p>
                <p className="text-sm text-ink-600 font-medium">
                  ৳{formatCurrency(stats!.totalCost)} ÷ {stats!.totalMeals.toFixed(2)} meals
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
