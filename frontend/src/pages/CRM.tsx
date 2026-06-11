import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Lead, User } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Table, TableRow, TableCell } from "../components/ui/Table";
import { LeadActivityTimeline } from "../components/LeadActivityTimeline";
import { 
  Download, 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit3, 
  Trash2,
  Clock
} from "lucide-react";

export const CRM: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [team, setTeam] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [isAtRisk, setIsAtRisk] = useState<boolean | undefined>(undefined);
  const [skip, setSkip] = useState(0);
  const limit = 10;

  // Selected Lead & Detail pane
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [timelineRefresh, setTimelineRefresh] = useState(0);
  const [activityNote, setActivityNote] = useState("");
  const [activityType, setActivityType] = useState("note");

  // Add/Edit Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Partial<Lead>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // New Lead form inputs
  const [newLead, setNewLead] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    status: "new",
    source: "direct",
    academic_interest: "",
    notes: "",
    assigned_to: "",
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await api.getLeads({
        skip,
        limit,
        status: status || undefined,
        assigned_to: assignedTo || undefined,
        is_at_risk: isAtRisk,
        search: search || undefined,
      });
      setLeads(data.items);
      setTotal(data.total);
      
      // If a lead was selected, update its reference in case data refreshed
      if (selectedLead) {
        const updated = data.items.find(l => l.id === selectedLead.id);
        if (updated) setSelectedLead(updated);
      }
    } catch (err) {
      console.error("Failed to load leads", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const data = await api.getUsers();
      setTeam(data);
    } catch (err) {
      console.error("Failed to fetch team", err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [skip, status, assignedTo, isAtRisk]);

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSkip(0);
    fetchLeads();
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.createLead({
        ...newLead,
        assigned_to: newLead.assigned_to || null,
        email: newLead.email || null,
        phone: newLead.phone || null,
      });
      setIsAddModalOpen(false);
      setNewLead({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        status: "new",
        source: "direct",
        academic_interest: "",
        notes: "",
        assigned_to: "",
      });
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || "Failed to create lead");
    }
  };

  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead.id) return;
    setFormError(null);
    try {
      const updated = await api.updateLead(editingLead.id, {
        ...editingLead,
        assigned_to: editingLead.assigned_to || null,
      });
      setIsEditModalOpen(false);
      setSelectedLead(updated);
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || "Failed to update lead details");
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lead? This cannot be undone.")) return;
    try {
      await api.deleteLead(id);
      if (selectedLead?.id === id) setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      alert("Failed to delete lead. Check if you have Admin rights.");
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !activityNote.trim()) return;
    try {
      await api.addLeadActivity(selectedLead.id, activityType, activityNote);
      setActivityNote("");
      setTimelineRefresh(prev => prev + 1);
      fetchLeads();
    } catch (err) {
      alert("Failed to save activity log");
    }
  };

  const handleExportCSV = () => {
    const url = api.getExportLeadsUrl({
      status: status || undefined,
      assigned_to: assignedTo || undefined,
      is_at_risk: isAtRisk,
      search: search || undefined,
    });
    window.open(url, "_blank");
  };

  const getStatusBadge = (s: string) => {
    const badges: Record<string, string> = {
      new: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
      contacted: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30",
      interview_scheduled: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
      admitted: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
      rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
      lost: "bg-slate-500/10 text-slate-400 border border-slate-500/30",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${badges[s] || ""}`}>
        {s.replace("_", " ")}
      </span>
    );
  };

  const getUserName = (userId?: string) => {
    if (!userId) return "Unassigned";
    const u = team.find(t => t.id === userId);
    return u ? `${u.first_name} ${u.last_name}` : "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Leads Management CRM</h2>
          <p className="text-xs text-slate-400 mt-1">Track admissions candidates, assignment status, and contact audits</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            CSV Export
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2 relative">
            <Input
              label="Search Leads"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
            <button type="submit" className="absolute right-3 bottom-2.5 text-slate-400 hover:text-white cursor-pointer">
              <Search className="w-4 h-4" />
            </button>
          </div>

          <Select
            label="Admission Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "", label: "All Statuses" },
              { value: "new", label: "New" },
              { value: "contacted", label: "Contacted" },
              { value: "interview_scheduled", label: "Interview Scheduled" },
              { value: "admitted", label: "Admitted" },
              { value: "rejected", label: "Rejected" },
              { value: "lost", label: "Lost" },
            ]}
          />

          <Select
            label="Assigned To"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            options={[
              { value: "", label: "All Assignees" },
              ...team.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))
            ]}
          />

          <Select
            label="At Risk Level"
            value={isAtRisk === undefined ? "" : isAtRisk.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setIsAtRisk(val === "" ? undefined : val === "true");
            }}
            options={[
              { value: "", label: "All Risk Levels" },
              { value: "true", label: "At Risk Flagged" },
              { value: "false", label: "Normal" },
            ]}
          />
        </form>
      </Card>

      {/* Main Grid: Split List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Leads Table Container */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0">
            {loading && leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500" />
                <p className="text-xs text-slate-500">Loading admissions records...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-sm">
                No CRM records match your filter criteria.
              </div>
            ) : (
              <Table headers={["Name", "Program / Interest", "Status", "Assignee", "Alerts"]}>
                {leads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className={`cursor-pointer ${selectedLead?.id === lead.id ? "bg-darkbg-700/60" : ""}`}
                    onClick={() => {
                      setSelectedLead(lead);
                      setTimelineRefresh(prev => prev + 1);
                    }}
                  >
                    <TableCell>
                      <div className="font-semibold text-white">{lead.first_name} {lead.last_name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{lead.email || "No email"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-slate-300 font-medium">{lead.academic_interest || "N/A"}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 capitalize">Source: {lead.source}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-400">
                        {getUserName(lead.assigned_to)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {lead.is_at_risk ? (
                        <span className="flex items-center gap-1 text-accent-danger font-semibold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Risk Flag
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {skip + 1} - {Math.min(skip + limit, total)} of {total} leads
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={skip === 0}
                onClick={() => setSkip(prev => Math.max(0, prev - limit))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={skip + limit >= total}
                onClick={() => setSkip(prev => prev + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Lead Details Pane */}
        <div>
          {selectedLead ? (
            <Card className="space-y-6 sticky top-8">
              {/* Card Header & Controls */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedLead.first_name} {selectedLead.last_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedLead.phone || "No phone number available"}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="p-2"
                    onClick={() => {
                      setEditingLead(selectedLead);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="p-2 text-accent-danger hover:bg-red-500/10 hover:border-red-500/50"
                    onClick={() => handleDeleteLead(selectedLead.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Risk Banner */}
              {selectedLead.is_at_risk && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-accent-danger">
                    <AlertTriangle className="w-4 h-4" />
                    AT RISK DETECTED
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{selectedLead.risk_reason}</p>
                </div>
              )}

              {/* Metadata list */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <span className="font-semibold text-white mt-1 block capitalize">{selectedLead.status.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Interest Program</span>
                  <span className="font-semibold text-white mt-1 block truncate">{selectedLead.academic_interest || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Assignee</span>
                  <span className="font-semibold text-white mt-1 block truncate">{getUserName(selectedLead.assigned_to)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Lead Source</span>
                  <span className="font-semibold text-white mt-1 block capitalize">{selectedLead.source}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <span className="text-xs text-slate-500 block mb-1">Administrative Notes</span>
                <div className="bg-darkbg-900/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 leading-relaxed min-h-[50px]">
                  {selectedLead.notes || "No notes logged."}
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="border-t border-slate-800 pt-5">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Activity Audit Log</h4>
                <LeadActivityTimeline leadId={selectedLead.id} refreshTrigger={timelineRefresh} />
              </div>

              {/* Quick Log Input */}
              <form onSubmit={handleAddActivity} className="border-t border-slate-800 pt-5 space-y-3">
                <div className="flex gap-2">
                  <Select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    options={[
                      { value: "note", label: "Note" },
                      { value: "call", label: "Call" },
                      { value: "email", label: "Email" },
                    ]}
                    wrapperClassName="w-24"
                    className="py-1 px-2 text-xs"
                  />
                  <Input
                    placeholder="Log a client interaction..."
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                    wrapperClassName="flex-1"
                    className="py-1 px-2 text-xs"
                    required
                  />
                </div>
                <Button type="submit" size="sm" className="w-full text-xs">Log Action</Button>
              </form>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500 text-sm py-28 space-y-3">
              <Clock className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <p>Select a candidate from the CRM list to view details, timelines, and audit logs.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Candidate">
        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-accent-danger mb-4">
            {formError}
          </div>
        )}
        <form onSubmit={handleAddLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={newLead.first_name}
              onChange={(e) => setNewLead(prev => ({ ...prev, first_name: e.target.value }))}
              required
            />
            <Input
              label="Last Name"
              value={newLead.last_name}
              onChange={(e) => setNewLead(prev => ({ ...prev, last_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={newLead.email}
              onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              label="Phone Number"
              value={newLead.phone}
              onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Academic Program"
              value={newLead.academic_interest}
              onChange={(e) => setNewLead(prev => ({ ...prev, academic_interest: e.target.value }))}
              options={[
                { value: "", label: "Select Program" },
                { value: "Grade 9 - Standard Curriculum", label: "Grade 9 - Standard" },
                { value: "Grade 10 - Standard Curriculum", label: "Grade 10 - Standard" },
                { value: "Grade 11 - Computer Science", label: "Grade 11 - CS" },
                { value: "Grade 11 - Science & Math", label: "Grade 11 - STEM" },
                { value: "Grade 12 - Advanced Physics", label: "Grade 12 - Physics" },
                { value: "Grade 12 - Arts and Humanities", label: "Grade 12 - Arts" },
              ]}
            />
            <Select
              label="Lead Source"
              value={newLead.source}
              onChange={(e) => setNewLead(prev => ({ ...prev, source: e.target.value }))}
              options={[
                { value: "direct", label: "Direct Visit / Walk-in" },
                { value: "website", label: "Online Website Inquiry" },
                { value: "referral", label: "Referral / Word of Mouth" },
                { value: "whatsapp", label: "WhatsApp Broadcast" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assigned Operator"
              value={newLead.assigned_to}
              onChange={(e) => setNewLead(prev => ({ ...prev, assigned_to: e.target.value }))}
              options={[
                { value: "", label: "Unassigned" },
                ...team.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))
              ]}
            />
            <Select
              label="Lead Status"
              value={newLead.status}
              onChange={(e) => setNewLead(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: "new", label: "New Lead" },
                { value: "contacted", label: "Contacted" },
                { value: "interview_scheduled", label: "Interview Scheduled" },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 tracking-wider mb-1.5 block">Lead Inquiry Notes</label>
            <textarea
              className="w-full bg-darkbg-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-all min-h-[80px]"
              value={newLead.notes}
              onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Record initial comments, parents requirements, specific concerns..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Candidate</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Candidate Details">
        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-accent-danger mb-4">
            {formError}
          </div>
        )}
        <form onSubmit={handleEditLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={editingLead.first_name || ""}
              onChange={(e) => setEditingLead(prev => ({ ...prev, first_name: e.target.value }))}
              required
            />
            <Input
              label="Last Name"
              value={editingLead.last_name || ""}
              onChange={(e) => setEditingLead(prev => ({ ...prev, last_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={editingLead.email || ""}
              onChange={(e) => setEditingLead(prev => ({ ...prev, email: e.target.value }))}
            />
            <Input
              label="Phone Number"
              value={editingLead.phone || ""}
              onChange={(e) => setEditingLead(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Academic Program"
              value={editingLead.academic_interest || ""}
              onChange={(e) => setEditingLead(prev => ({ ...prev, academic_interest: e.target.value }))}
              options={[
                { value: "", label: "N/A" },
                { value: "Grade 9 - Standard Curriculum", label: "Grade 9 - Standard" },
                { value: "Grade 10 - Standard Curriculum", label: "Grade 10 - Standard" },
                { value: "Grade 11 - Computer Science", label: "Grade 11 - CS" },
                { value: "Grade 11 - Science & Math", label: "Grade 11 - STEM" },
                { value: "Grade 12 - Advanced Physics", label: "Grade 12 - Physics" },
                { value: "Grade 12 - Arts and Humanities", label: "Grade 12 - Arts" },
              ]}
            />
            <Select
              label="Lead Status"
              value={editingLead.status || ""}
              onChange={(e) => setEditingLead(prev => ({ ...prev, status: e.target.value as any }))}
              options={[
                { value: "new", label: "New Lead" },
                { value: "contacted", label: "Contacted" },
                { value: "interview_scheduled", label: "Interview Scheduled" },
                { value: "admitted", label: "Admitted" },
                { value: "rejected", label: "Rejected" },
                { value: "lost", label: "Lost / Dropped" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assigned Operator"
              value={editingLead.assigned_to || ""}
              onChange={(e) => setEditingLead(prev => ({ ...prev, assigned_to: e.target.value }))}
              options={[
                { value: "", label: "Unassigned" },
                ...team.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))
              ]}
            />
            <Select
              label="At Risk Alert"
              value={editingLead.is_at_risk === undefined ? "false" : editingLead.is_at_risk.toString()}
              onChange={(e) => setEditingLead(prev => ({ ...prev, is_at_risk: e.target.value === "true" }))}
              options={[
                { value: "false", label: "Normal (No Action Required)" },
                { value: "true", label: "Flag At Risk" },
              ]}
            />
          </div>

          {editingLead.is_at_risk && (
            <Input
              label="Risk Assessment Explanation"
              value={editingLead.risk_reason || ""}
              onChange={(e) => setEditingLead(prev => ({ ...prev, risk_reason: e.target.value }))}
              placeholder="Explain the reasons why this student has a high risk of dropping out or withdrawing..."
              required
            />
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 tracking-wider mb-1.5 block">Administrative Comments</label>
            <textarea
              className="w-full bg-darkbg-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-all min-h-[80px]"
              value={editingLead.notes || ""}
              onChange={(e) => setEditingLead(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
