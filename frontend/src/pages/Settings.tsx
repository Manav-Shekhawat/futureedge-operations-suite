import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import type { User } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Loader2, 
  Plus,
  Check
} from "lucide-react";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  
  // Institute Settings

  const [instLoading, setInstLoading] = useState(true);
  const [instSaving, setInstSaving] = useState(false);
  const [instSuccess, setInstSuccess] = useState(false);
  const [instForm, setInstForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo_url: ""
  });

  // Team Administration (Admin Only)
  const [team, setTeam] = useState<User[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newMemberError, setNewMemberError] = useState<string | null>(null);
  const [newMemberLoading, setNewMemberLoading] = useState(false);
  const [newMember, setNewMember] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "staff"
  });

  const fetchInstitute = async () => {
    setInstLoading(true);
    try {
      const data = await api.getSettings();

      setInstForm({
        name: data.name,
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
        logo_url: data.logo_url || ""
      });
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setInstLoading(false);
    }
  };

  const fetchTeam = async () => {
    if (user?.role !== "admin") return;
    setTeamLoading(true);
    try {
      const data = await api.getUsers();
      setTeam(data);
    } catch (err) {
      console.error("Failed to fetch team", err);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitute();
    fetchTeam();
  }, [user]);

  const handleUpdateInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstSaving(true);
    setInstSuccess(false);
    try {
      await api.updateSettings(instForm);

      setInstSuccess(true);
      setTimeout(() => setInstSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save settings. Confirm you have Admin privileges.");
    } finally {
      setInstSaving(false);
    }
  };

  const handleAddTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewMemberError(null);
    setNewMemberLoading(true);
    try {
      await api.createUser({
        ...newMember
      });
      setIsAddTeamModalOpen(false);
      setNewMember({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "staff"
      });
      fetchTeam();
    } catch (err: any) {
      setNewMemberError(err.message || "Failed to create team member");
    } finally {
      setNewMemberLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">Settings & Members</h2>
        <p className="text-xs text-slate-400 mt-1">Configure institute profile defaults and register operations team members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Institute settings form */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Institute Profile Configuration" subtitle="General identity settings stamped on generated documents">
            {instLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                <span className="text-xs text-slate-500">Loading settings...</span>
              </div>
            ) : (
              <form onSubmit={handleUpdateInstitute} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Institute Public Name"
                    value={instForm.name}
                    onChange={(e) => setInstForm(prev => ({ ...prev, name: e.target.value }))}
                    wrapperClassName="sm:col-span-2"
                    required
                    disabled={user?.role !== "admin"}
                  />
                  <Input
                    label="Operations Contact Email"
                    type="email"
                    value={instForm.email}
                    onChange={(e) => setInstForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={user?.role !== "admin"}
                  />
                  <Input
                    label="Operations Telephone"
                    value={instForm.phone}
                    onChange={(e) => setInstForm(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={user?.role !== "admin"}
                  />
                  <Input
                    label="Official Website Domain"
                    value={instForm.website}
                    onChange={(e) => setInstForm(prev => ({ ...prev, website: e.target.value }))}
                    disabled={user?.role !== "admin"}
                  />
                  <Input
                    label="Logo URL Image"
                    value={instForm.logo_url}
                    onChange={(e) => setInstForm(prev => ({ ...prev, logo_url: e.target.value }))}
                    disabled={user?.role !== "admin"}
                  />
                  <Input
                    label="Mailing Address"
                    value={instForm.address}
                    onChange={(e) => setInstForm(prev => ({ ...prev, address: e.target.value }))}
                    wrapperClassName="sm:col-span-2"
                    disabled={user?.role !== "admin"}
                  />
                </div>

                {instSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Institute configuration updated successfully!
                  </div>
                )}

                {user?.role === "admin" && (
                  <div className="flex justify-end pt-2">
                    <Button type="submit" loading={instSaving}>
                      Save System Settings
                    </Button>
                  </div>
                )}
              </form>
            )}
          </Card>
        </div>

        {/* Team Members settings */}
        <div>
          {user?.role === "admin" ? (
            <Card 
              title="Operations Members" 
              subtitle="Manage staff accounts and privileges"
              headerActions={
                <Button size="sm" onClick={() => setIsAddTeamModalOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add User
                </Button>
              }
            >
              {teamLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : team.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No other operators found.
                </div>
              ) : (
                <div className="space-y-4">
                  {team.map((member) => (
                    <div key={member.id} className="flex items-center justify-between border-b border-slate-800/80 pb-3 last:border-0 last:pb-0">
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{member.first_name} {member.last_name}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {member.role === "admin" ? (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-darkbg-700 border border-slate-700 px-1.5 py-0.5 rounded">
                            Staff
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card title="Permissions Level" className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                STAFF ACCOUNT
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your account is configured with Staff level authorization. You can edit candidate timelines, log communications, and generate reports. To edit institute profile parameters or manage user roles, please contact your systems Administrator.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Add Team Member Modal */}
      <Modal isOpen={isAddTeamModalOpen} onClose={() => setIsAddTeamModalOpen(false)} title="Register Team Member">
        {newMemberError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-accent-danger mb-4">
            {newMemberError}
          </div>
        )}
        <form onSubmit={handleAddTeamSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={newMember.first_name}
              onChange={(e) => setNewMember(prev => ({ ...prev, first_name: e.target.value }))}
              required
            />
            <Input
              label="Last Name"
              value={newMember.last_name}
              onChange={(e) => setNewMember(prev => ({ ...prev, last_name: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            value={newMember.email}
            onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
            required
          />

          <Input
            label="Temporary Password"
            type="password"
            value={newMember.password}
            onChange={(e) => setNewMember(prev => ({ ...prev, password: e.target.value }))}
            placeholder="min 6 chars"
            required
          />

          <Select
            label="Assign Authorization Level"
            value={newMember.role}
            onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
            options={[
              { value: "staff", label: "Staff (Core Admissions & Log Uploads)" },
              { value: "admin", label: "Administrator (Full settings control)" },
            ]}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddTeamModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={newMemberLoading}>Register User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
