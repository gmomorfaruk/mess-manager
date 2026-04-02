"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, getCurrentMonth, getMonthRange } from "@/lib/utils";
import type { MessMember, Deposit } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import MonthPicker from "@/components/ui/MonthPicker";
import { Wallet, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function DepositsClient() {
  const { member: currentMember } = useAuth();
  const [{ year, month }, setYearMonth] = useState(getCurrentMonth());
  const [members, setMembers] = useState<MessMember[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedMember, setSelectedMember] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");

  const supabase = createClient();
  const messId = currentMember?.mess_id;

  const fetchData = useCallback(async () => {
    if (!messId) return;
    setLoading(true);
    const { start, end } = getMonthRange(year, month);

    const [membersRes, depositsRes] = await Promise.all([
      supabase.from("mess_members").select("*").eq("mess_id", messId).eq("is_active", true).order("name"),
      supabase
        .from("deposits")
        .select("*")
        .eq("mess_id", messId)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false }),
    ]);

    setMembers(membersRes.data ?? []);
    setDeposits(depositsRes.data ?? []);
    setLoading(false);
  }, [messId, year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (members.length > 0 && !selectedMember) setSelectedMember(members[0].id); }, [members]);

  const addDeposit = async () => {
    if (!messId || !currentMember || !selectedMember || !amount) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("deposits").insert({
        mess_id: messId,
        member_id: selectedMember,
        amount: amt,
        date,
        note: note || null,
        created_by: null,
      });
      if (error) throw error;
      setAmount("");
      setNote("");
      toast.success("Deposit added!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add deposit");
    } finally {
      setSaving(false);
    }
  };

  const deleteDeposit = async (id: string) => {
    const { error } = await supabase.from("deposits").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchData(); }
  };

  const totalDeposits = deposits.reduce((s, d) => s + Number(d.amount), 0);

  // Group deposits by member for display
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Deposits</h1>
          <p className="text-sm text-ink-400 mt-0.5">Manage member deposits</p>
        </div>
        <MonthPicker year={year} month={month} onChange={(y, m) => setYearMonth({ year: y, month: m })} />
      </div>

      {/* Add deposit form */}
      <div className="card p-5">
        <h2 className="font-semibold text-ink-900 text-sm mb-4 flex items-center gap-2">
          <Plus size={16} className="text-brand-600" />
          Add New Deposit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="input"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Amount (৳)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              className="input"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={addDeposit} disabled={saving || !amount || !selectedMember} className="btn-primary">
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
            {saving ? "Saving…" : "Add Deposit"}
          </button>
        </div>
      </div>

      {/* Deposits list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-ink-400" />
            <h2 className="font-semibold text-ink-900 text-sm">Deposit History</h2>
          </div>
          {totalDeposits > 0 && (
            <span className="text-sm font-semibold text-ink-900">
              Total: ৳{formatCurrency(totalDeposits)}
            </span>
          )}
        </div>

        {deposits.length === 0 ? (
          <EmptyState icon={Wallet} title="No deposits this month" description="Add member deposits using the form above" />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((deposit) => {
                  const mem = memberMap[deposit.member_id];
                  return (
                    <tr key={deposit.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-brand-700">{mem?.name?.[0] ?? "?"}</span>
                          </div>
                          <span className="font-medium text-ink-900">{mem?.name ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="text-ink-500">{formatDate(deposit.date)}</td>
                      <td className="font-semibold text-green-700">৳{formatCurrency(deposit.amount)}</td>
                      <td className="text-ink-400">{deposit.note ?? "—"}</td>
                      <td className="text-right">
                        <button
                          onClick={() => deleteDeposit(deposit.id)}
                          className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
