import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Lead } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Mail, 
  MessageSquare, 
  AlertTriangle,
  Send,
  Loader2
} from "lucide-react";

export const AuditAssistant: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Generation Settings
  const [channel, setChannel] = useState<'email' | 'whatsapp'>("email");
  const [tone, setTone] = useState("supportive");
  
  // Output state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>("");

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await api.getLeads({ limit: 100 });
        setLeads(data.items);
      } catch (err) {
        console.error("Failed to load leads", err);
      }
    };
    const fetchStatus = async () => {
      try {
        const data = await api.getAiStatus();
        setAiStatus(data.status);
      } catch (err) {
        setAiStatus("Fallback Mode");
      }
    };
    fetchLeads();
    fetchStatus();
  }, []);

  const handleLeadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedLeadId(id);
    const lead = leads.find(l => l.id === id) || null;
    setSelectedLead(lead);
    setMessage(null);
    setSaveSuccess(false);
  };

  const handleGenerate = async () => {
    if (!selectedLeadId) return;
    setLoading(true);
    setMessage(null);
    setSaveSuccess(false);
    try {
      const data = await api.generateFollowUp(selectedLeadId, channel, tone);
      setMessage(data.suggested_message);
    } catch (err) {
      alert("Failed to generate message using Gemini. Please verify API key setup.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!message) return;
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogActivity = async () => {
    if (!selectedLead || !message) return;
    try {
      // Log this as an email/whatsapp activity
      await api.addLeadActivity(
        selectedLead.id,
        channel,
        `Sent follow-up message using tone '${tone}':\n\n${message}`,
        { generated_by_ai: true, tone, channel }
      );
      setSaveSuccess(true);
    } catch (err) {
      alert("Failed to log activity");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">AI Follow-Up Assistant</h2>
          <p className="text-xs text-slate-400 mt-1">Generate tailored follow-up templates using parent conversation contexts via Gemini</p>
        </div>
        <div className="flex items-center gap-2 bg-darkbg-800 border border-slate-700/80 rounded-xl px-4 py-2 self-start sm:self-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Status</span>
          <span className={`h-2 w-2 rounded-full ${aiStatus === "Connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
          <span className="text-xs font-bold text-slate-300">{aiStatus || "Loading..."}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Settings Panel */}
        <div className="space-y-6">
          <Card title="Generation Parameters" subtitle="Configure the candidate and communication rules">
            <div className="space-y-5">
              <Select
                label="Select Candidate"
                value={selectedLeadId}
                onChange={handleLeadChange}
                options={[
                  { value: "", label: "Choose a lead..." },
                  ...leads.map(l => ({ value: l.id, label: `${l.first_name} ${l.last_name} (${l.academic_interest || "General"})` }))
                ]}
              />

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-300 tracking-wider">Select Channel</span>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setChannel("email")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      channel === "email"
                        ? "bg-electric-500/10 border-electric-500 text-electric-500"
                        : "bg-darkbg-900 border-slate-700/80 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email Layout
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("whatsapp")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      channel === "whatsapp"
                        ? "bg-green-500/10 border-green-500 text-green-400"
                        : "bg-darkbg-900 border-slate-700/80 text-slate-400 hover:text-white"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </div>

              <Select
                label="Message Tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                options={[
                  { value: "supportive", label: "Supportive / Caring" },
                  { value: "professional", label: "Professional / Formal" },
                  { value: "urgent", label: "Urgent (Pending Decision)" },
                  { value: "empathetic", label: "Empathetic (Address Concerns)" },
                ]}
              />

              <Button
                onClick={handleGenerate}
                disabled={!selectedLeadId || loading}
                className="w-full mt-2"
                loading={loading}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Template
              </Button>
            </div>
          </Card>

          {/* Mini Details Preview */}
          {selectedLead && (
            <Card title="Candidate Background" subtitle="Recent context fetched from CRM">
              <div className="space-y-4 text-xs">
                {selectedLead.is_at_risk && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex gap-2 items-start text-[11px] text-accent-danger leading-relaxed">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Flagged At Risk:</span> {selectedLead.risk_reason}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Interest Program</span>
                  <span className="font-semibold text-white mt-0.5 block">{selectedLead.academic_interest || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Notes</span>
                  <p className="text-slate-300 bg-darkbg-900/60 p-2.5 rounded-lg border border-slate-800/80 mt-1 max-h-24 overflow-y-auto leading-relaxed">
                    {selectedLead.notes || "No notes logged."}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Output Area */}
        <div className="lg:col-span-2">
          {message ? (
            <Card 
              title="Generated Communication Template" 
              subtitle="Copy draft below. Make edits as needed before sending."
              headerActions={
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4 text-emerald-400 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {copied ? "Copied" : "Copy to Clipboard"}
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleLogActivity}
                    disabled={saveSuccess}
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    {saveSuccess ? "Logged to CRM" : "Log Activity"}
                  </Button>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="bg-darkbg-900 border border-slate-700/80 rounded-xl p-5 min-h-[300px] text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                  {message}
                </div>
                
                {saveSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Activity logged successfully! This communication is now recorded on the candidate's CRM history timeline.
                  </div>
                )}
              </div>
            </Card>
          ) : loading ? (
            <Card className="flex flex-col items-center justify-center py-40 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-electric-500" />
              <p className="text-sm text-slate-400">Gemini is drafting a personalized follow-up based on candidate history...</p>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500 text-sm py-40 space-y-3">
              <Sparkles className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <p>Configure candidate details on the left, then click **Generate Template** to view AI-designed follow-ups.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
