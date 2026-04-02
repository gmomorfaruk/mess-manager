"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import {
  calculateMonthlyStats, formatCurrency, formatDate,
  getCurrentMonth, getMonthRange, getMonthLabel, calculateMealValue,
} from "@/lib/utils";
import type { MessMember, MealSettings, DailyMeal, DailyCost, Deposit } from "@/types";
import StatCard from "@/components/ui/StatCard";
import MonthPicker from "@/components/ui/MonthPicker";
import BalanceBadge from "@/components/ui/BalanceBadge";
import { PageLoader } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import {
  UtensilsCrossed, Wallet, TrendingUp, Sun, Sunset, Moon,
  CalendarDays, Receipt,
} from "lucide-react";

export default function MemberDashboardClient() {
  const { member: currentMember, loading: authLoading } = useAuth();
  const [{ year, month }, setYearMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allMembers, setAllMembers] = useState<MessMember[]>([]);
  const [settings, setSettings] = useState<MealSettings | null>(null);
  const [myMeals, setMyMeals] = useState<DailyMeal[]>([]);
  const [allMeals, setAllMeals] = useState<DailyMeal[]>([]);
  const [costs, setCosts] = useState<DailyCost[]>([]);
  const [myDeposits, setMyDeposits] = useState<Deposit[]>([]);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);

  const supabase = createClient();
  const messId = currentMember?.mess_id;

  const fetchData = useCallback(async () => {
    if (!messId || !currentMember) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { start, end } = getMonthRange(year, month);

    try {
      const [membersRes, settingsRes, allMealsRes, costsRes, allDepositsRes] = await Promise.all([
        supabase.from("mess_members").select("*").eq("mess_id", messId).eq("is_active", true),
        supabase.from("meal_settings").select("*").eq("mess_id", messId).maybeSingle(),
        supabase.from("daily_meals").select("*").eq("mess_id", messId).gte("date", start).lte("date", end),
        supabase.from("daily_costs").select("*").eq("mess_id", messId).gte("date", start).lte("date", end),
        supabase.from("deposits").select("*").eq("mess_id", messId).gte("date", start).lte("date", end),
      ]);

      const firstError = membersRes.error ?? settingsRes.error ?? allMealsRes.error ?? costsRes.error ?? allDepositsRes.error;
      if (firstError) throw firstError;

      const allMealsData = allMealsRes.data ?? [];
      const allDepositsData = allDepositsRes.data ?? [];

      setAllMembers(membersRes.data ?? []);
      setSettings(settingsRes.data);
      setAllMeals(allMealsData);
      setMyMeals(allMealsData.filter((m) => m.member_id === currentMember.id));
      setCosts(costsRes.data ?? []);
      setAllDeposits(allDepositsData);
      setMyDeposits(allDepositsData.filter((d) => d.member_id === currentMember.id));
    } catch (err: any) {
      setError(err?.message ?? "Failed to load member dashboard");
    } finally {
      setLoading(false);
    }
  }, [messId, currentMember?.id, year, month]);

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
    ? calculateMonthlyStats(allMembers, allMeals, costs, allDeposits, settings)
    : null;

  const mySummary = stats?.memberSummaries.find((s) => s.member.id === currentMember.id);

  const totalMyMeals = mySummary?.totalMeals ?? 0;
  const totalMyDeposit = mySummary?.totalDeposit ?? 0;
  const totalMyCost = mySummary?.totalCost ?? 0;
  const myBalance = mySummary?.balance ?? 0;
  const mealRate = stats?.mealRate ?? 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">
            My Dashboard
          </h1>
          <p className="text-sm text-ink-400 mt-0.5">
            {currentMember.name} · {getMonthLabel(year, month)}
          </p>
        </div>
        <MonthPicker year={year} month={month} onChange={(y, m) => setYearMonth({ year: y, month: m })} />
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
          <p className="text-ink-500">Meal settings not configured yet. Please contact your admin.</p>
        </div>
      ) : (
        <>
          {/* Balance hero card */}
          <div className={`card p-6 border-2 ${myBalance >= 0 ? "border-green-200 bg-gradient-to-br from-green-50 to-white" : "border-red-200 bg-gradient-to-br from-red-50 to-white"}`}>
            <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-2">Current Balance</p>
            <BalanceBadge balance={myBalance} size="lg" />
            <p className="text-xs text-ink-400 mt-2">
              {myBalance >= 0
                ? "You're in good standing this month."
                : "Please deposit to clear your dues."}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="My Meals"
              value={totalMyMeals.toFixed(2)}
              sub="Meal units"
              icon={UtensilsCrossed}
            />
            <StatCard
              label="Meal Rate"
              value={`৳${formatCurrency(mealRate)}`}
              sub="Per unit"
              icon={TrendingUp}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <StatCard
              label="My Cost"
              value={`৳${formatCurrency(totalMyCost)}`}
              sub="This month"
              icon={Receipt}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
            />
            <StatCard
              label="My Deposits"
              value={`৳${formatCurrency(totalMyDeposit)}`}
              sub="This month"
              icon={Wallet}
              iconBg="bg-purple-50"
              iconColor="text-purple-500"
            />
          </div>

          {/* Meal history */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
              <CalendarDays size={16} className="text-ink-400" />
              <h2 className="font-semibold text-ink-900 text-sm">My Meal History</h2>
              <span className="badge bg-surface-100 text-ink-500 ml-auto">{myMeals.length} days</span>
            </div>
            {myMeals.length === 0 ? (
              <EmptyState icon={UtensilsCrossed} title="No meals recorded" description="Your meal entries will appear here once the manager adds them" />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="text-center">
                        <span className="flex items-center justify-center gap-1"><Sun size={13} className="text-orange-400" />Morning</span>
                      </th>
                      <th className="text-center">
                        <span className="flex items-center justify-center gap-1"><Sunset size={13} className="text-blue-400" />Lunch</span>
                      </th>
                      <th className="text-center">
                        <span className="flex items-center justify-center gap-1"><Moon size={13} className="text-indigo-400" />Dinner</span>
                      </th>
                      <th className="text-right">Meals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...myMeals].sort((a, b) => b.date.localeCompare(a.date)).map((meal) => {
                      const val = calculateMealValue(meal, settings);
                      return (
                        <tr key={meal.id}>
                          <td className="text-ink-500 text-sm">{formatDate(meal.date)}</td>
                          <td className="text-center">
                            {meal.took_morning
                              ? <span className="text-orange-500 font-semibold text-sm">✓</span>
                              : <span className="text-ink-200">—</span>}
                          </td>
                          <td className="text-center">
                            {meal.took_lunch
                              ? <span className="text-blue-500 font-semibold text-sm">✓</span>
                              : <span className="text-ink-200">—</span>}
                          </td>
                          <td className="text-center">
                            {meal.took_dinner
                              ? <span className="text-indigo-500 font-semibold text-sm">✓</span>
                              : <span className="text-ink-200">—</span>}
                          </td>
                          <td className="text-right">
                            <span className="font-semibold text-brand-700">{val.toFixed(2)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-50 font-semibold">
                      <td colSpan={4} className="px-4 py-3 text-sm text-ink-700">Total</td>
                      <td className="px-4 py-3 text-right text-brand-700">{totalMyMeals.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Deposit history */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
              <Wallet size={16} className="text-ink-400" />
              <h2 className="font-semibold text-ink-900 text-sm">My Deposit History</h2>
            </div>
            {myDeposits.length === 0 ? (
              <EmptyState icon={Wallet} title="No deposits this month" description="Your deposits will appear here once added by the manager" />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...myDeposits].sort((a, b) => b.date.localeCompare(a.date)).map((d) => (
                      <tr key={d.id}>
                        <td className="text-ink-500">{formatDate(d.date)}</td>
                        <td className="font-semibold text-green-700">৳{formatCurrency(d.amount)}</td>
                        <td className="text-ink-400">{d.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-ink-700">Total</td>
                      <td className="px-4 py-3 text-green-700">৳{formatCurrency(totalMyDeposit)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Cost breakdown */}
          <div className="card p-5 bg-surface-50">
            <h3 className="font-semibold text-ink-900 text-sm mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: "Total meals this month", value: `${totalMyMeals.toFixed(2)} units`, muted: true },
                { label: "Meal rate", value: `৳${formatCurrency(mealRate)} / unit`, muted: true },
                { label: "Total cost (meals × rate)", value: `৳${formatCurrency(totalMyCost)}`, muted: false },
                { label: "Total deposits", value: `৳${formatCurrency(totalMyDeposit)}`, muted: false, green: true },
              ].map(({ label, value, muted, green }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">{label}</span>
                  <span className={`font-medium ${green ? "text-green-700" : muted ? "text-ink-600" : "text-ink-900"}`}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="border-t border-surface-200 pt-3 flex items-center justify-between">
                <span className="font-semibold text-ink-900 text-sm">Balance</span>
                <BalanceBadge balance={myBalance} size="md" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
