"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import type { MessMember, UserRole } from "@/types";
import { PageLoader } from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import { Users, Plus, Edit2, UserX, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const ROLES: UserRole[] = ["admin", "manager", "member"];

const roleColors: Record<UserRole, string> = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  member: "bg-surface-100 text-ink-600",
};

export default function MembersClient() {
  const { member: currentMember } = useAuth();
  const [members, setMembers] = useState<MessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MessMember | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("member");

  const supabase = createClient();
  const messId = currentMember?.mess_id;

  const fetchMembers = useCallback(async () => {
    if (!messId) return;
    setLoading(true);
    const { data } = await supabase
      .from("mess_members")
      .select("*")
      .eq("mess_id", messId)
      .order("name");
    setMembers(data ?? []);
    setLoading(false);
  }, [messId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const openAdd = () => {
    setEditingMember(null);
    setFormName("");
    setFormEmail("");
    setFormRole("member");
    setShowModal(true);
  };

  const openEdit = (m: MessMember) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormEmail(m.email ?? "");
    setFormRole(m.role);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!messId || !formName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (editingMember) {
        const { error } = await supabase
          .from("mess_members")
          .update({ name: formName.trim(), email: formEmail || null, role: formRole })
          .eq("id", editingMember.id);
        if (error) throw error;
        toast.success("Member updated!");
      } else {
        const { error } = await supabase.from("mess_members").insert({
          mess_id: messId,
          name: formName.trim(),
          email: formEmail || null,
          role: formRole,
          is_active: true,
        });
        if (error) throw error;
        toast.success("Member added!");
      }
      setShowModal(false);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (m: MessMember) => {
    const { error } = await supabase
      .from("mess_members")
      .update({ is_active: !m.is_active })
      .eq("id", m.id);
    if (error) toast.error("Failed to update");
    else { toast.success(m.is_active ? "Member deactivated" : "Member activated"); fetchMembers(); }
  };

  if (loading) return <PageLoader />;

  const active = members.filter((m) => m.is_active);
  const inactive = members.filter((m) => !m.is_active);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Members</h1>
          <p className="text-sm text-ink-400 mt-0.5">{active.length} active · {inactive.length} inactive</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} />Add Member
        </button>
      </div>

      {/* Active members */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
          <Users size={16} className="text-ink-400" />
          <h2 className="font-semibold text-ink-900 text-sm">Active Members</h2>
          <span className="badge bg-brand-50 text-brand-700 ml-auto">{active.length}</span>
        </div>
        {active.length === 0 ? (
          <EmptyState icon={Users} title="No active members" action={
            <button onClick={openAdd} className="btn-primary">Add first member</button>
          } />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Connected</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {active.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-brand-700">{m.name[0]}</span>
                        </div>
                        <span className="font-medium text-ink-900">{m.name}</span>
                      </div>
                    </td>
                    <td className="text-ink-500 text-sm">{m.email ?? "—"}</td>
                    <td>
                      <span className={cn("badge", roleColors[m.role])}>{m.role}</span>
                    </td>
                    <td>
                      {m.user_id ? (
                        <span className="badge bg-green-50 text-green-700">✓ Linked</span>
                      ) : (
                        <span className="badge bg-surface-100 text-ink-400">Not linked</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(m)} className="btn-ghost p-2" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        {m.id !== currentMember?.id && (
                          <button onClick={() => toggleActive(m)} className="btn-ghost p-2 text-red-400 hover:text-red-600 hover:bg-red-50" title="Deactivate">
                            <UserX size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inactive */}
      {inactive.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
            <UserX size={16} className="text-ink-400" />
            <h2 className="font-semibold text-ink-900 text-sm">Inactive Members</h2>
            <span className="badge bg-surface-100 text-ink-500 ml-auto">{inactive.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {inactive.map((m) => (
                  <tr key={m.id} className="opacity-60">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center">
                          <span className="text-xs font-semibold text-ink-400">{m.name[0]}</span>
                        </div>
                        <span className="text-ink-600">{m.name}</span>
                      </div>
                    </td>
                    <td><span className={cn("badge", roleColors[m.role])}>{m.role}</span></td>
                    <td className="text-right">
                      <button onClick={() => toggleActive(m)} className="btn-ghost p-2 text-brand-600 hover:bg-brand-50">
                        <UserCheck size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingMember ? "Edit Member" : "Add Member"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Member name"
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="email@example.com"
              className="input"
            />
            <p className="text-xs text-ink-400 mt-1">
              Member will be linked when they sign in with this email.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1.5">Role</label>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setFormRole(r)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all capitalize",
                    formRole === r
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-surface-200 text-ink-500 hover:border-surface-300"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !formName.trim()} className="btn-primary flex-1">
              {saving ? "Saving…" : editingMember ? "Save Changes" : "Add Member"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
