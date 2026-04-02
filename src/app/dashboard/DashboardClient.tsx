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
  ShoppingCart, UtensilsCrossed, TrendingUp, Wallet,
  AlertCircle, BadgeCheck, Users, CalendarDays,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default function DashboardClient() {
  const { member, loading: authLoading } = useAuth();
  const [{ year, month }, setYearMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MessMember[]>([]);
  const [settings, setSettings] = useState<MealSettings | null>(null);
  const [meals, setMeals] = useState<DailyMeal[]>([]);
  const [costs, setCosts] = useState<DailyCost[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!member?.mess_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { start, end } = getMonthRange(year, month);

    try {
      const [membersRes, settingsRes, mealsRes, costsRes, depositsRes] = await Promise.all([
        supabase.from("mess_members").select("*").eq("mess_id", member.mess_id).eq("is_active", true).order("name"),
        supabase.from("meal_settings").select("*").eq("mess_id", member.mess_id).maybeSingle(),
        supabase.from("daily_meals").select("*").eq("mess_id", member.mess_id).gte("date", start).lte("date", end),
        supabase.from("daily_costs").select("*").eq("mess_id", member.mess_id).gte("date", start).lte("date", end).order("date", { ascending: false }),
        supabase.from("deposits").select("*").eq("mess_id", member.mess_id).gte("date", start).lte("date", end),
      ]);

      const firstError = membersRes.error ?? settingsRes.error ?? mealsRes.error ?? costsRes.error ?? depositsRes.error;
      if (firstError) throw firstError;

      setMembers(membersRes.data ?? []);
      setSettings(settingsRes.data);
      setMeals(mealsRes.data ?? []);
      setCosts(costsRes.data ?? []);
      setDeposits(depositsRes.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [member?.mess_id, year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (authLoading) return <PageLoader />;

  if (!member) {
    return (
      <div className="card p-8 text-center">
        <p className="text-ink-500 mb-3">Could not find your active mess membership.</p>
        <Link href="/setup" className="btn-primary">Go to setup</Link>
      </div>
    );
  }

  const isMember = member.role === "member";

  // Members can only see their own data
  if (isMember) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-500">Redirecting to your personal dashboard…</p>
        <Link href="/member" className="btn-primary mt-4 inline-flex">Go to My Dashboard</Link>
      </div>
    );
  }

  const stats = settings
    ? calculateMonthlyStats(members, meals, costs, deposits, settings)
    : null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-400 mt-0.5">Overview for {getMonthLabel(year, month)}</p>
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
          <p className="text-ink-500 mb-3">Meal settings not configured yet.</p>
          <Link href="/admin/settings" className="btn-primary">Configure Settings</Link>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Cost"
              value={`৳${formatCurrency(stats!.totalCost)}`}
              sub="Bazar expenses"
              icon={ShoppingCart}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
            />
            <StatCard
              label="Total Meals"
              value={stats!.totalMeals.toFixed(1)}
              sub="Meal units"
              icon={UtensilsCrossed}
              iconBg="bg-brand-50"
              iconColor="text-brand-600"
            />
            <StatCard
              label="Meal Rate"
              value={`৳${formatCurrency(stats!.mealRate)}`}
              sub="Per meal unit"
              icon={TrendingUp}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <StatCard
              label="Total Deposits"
              value={`৳${formatCurrency(stats!.totalDeposit)}`}
              sub="This month"
              icon={Wallet}
              iconBg="bg-purple-50"
              iconColor="text-purple-500"
            />
          </div>

          {/* Due / Extra */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-5 border-l-4 border-red-400">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={16} className="text-red-400" />
                <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">Total Due</p>
              </div>
              <p className="text-2xl font-semibold text-red-600">৳{formatCurrency(stats!.totalDue)}</p>
            </div>
            <div className="card p-5 border-l-4 border-green-400">
              <div className="flex items-center gap-2 mb-1">
                <BadgeCheck size={16} className="text-green-500" />
                <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">Total Extra</p>
              </div>
              <p className="text-2xl font-semibold text-green-600">৳{formatCurrency(stats!.totalExtra)}</p>
            </div>
          </div>

          {/* Members table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-ink-400" />
                <h2 className="font-semibold text-ink-900 text-sm">Member Summary</h2>
              </div>
              <span className="badge bg-surface-100 text-ink-500">{members.length} members</span>
            </div>
            {stats!.memberSummaries.length === 0 ? (
              <EmptyState icon={Users} title="No active members" />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Meals</th>
                      <th>Deposit</th>
                      <th>Cost</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats!.memberSummaries.map(({ member: m, totalMeals, totalDeposit, totalCost, balance }) => (
                      <tr key={m.id}>
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
                        <td className="font-mono text-ink-700">{totalMeals.toFixed(2)}</td>
                        <td className="text-ink-700">৳{formatCurrency(totalDeposit)}</td>
                        <td className="text-ink-700">৳{formatCurrency(totalCost)}</td>
                        <td><BalanceBadge balance={balance} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent bazar costs */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-ink-400" />
                <h2 className="font-semibold text-ink-900 text-sm">Recent Bazar Entries</h2>
              </div>
              <Link href="/manager/daily-entry" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                Add entry →
              </Link>
            </div>
            {costs.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="No bazar entries" description="Add daily bazar costs from the Daily Meals page" />
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
                    {costs.slice(0, 8).map((cost) => (
                      <tr key={cost.id}>
                        <td className="text-ink-500">{formatDate(cost.date)}</td>
                        <td className="font-semibold text-ink-900">৳{formatCurrency(cost.amount)}</td>
                        <td className="text-ink-400">{cost.note ?? "—"}</td>
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
