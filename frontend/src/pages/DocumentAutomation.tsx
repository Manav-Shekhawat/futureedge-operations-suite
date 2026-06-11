import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Lead } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { 
  FileText, 
  Loader2,
  Eye,
  Download,
  X
} from "lucide-react";

export const DocumentAutomation: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [docLogs, setDocLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(true);
  
  // Preview Modal state
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Form selections
  const [docType, setDocType] = useState<string>("acceptance_letter");
  const [linkedLeadId, setLinkedLeadId] = useState("");
  
  // Dynamic template variables
  const [variables, setVariables] = useState<Record<string, any>>({
    recipient_name: "",
    recipient_email: "",
    academic_interest: "",
    admission_date: new Date().toISOString().split('T')[0],
    signature: "",
    amount: "35000.00",
    payment_method: "Net Banking / UPI",
    details: "BCA Program Enrollment Fee (First Semester)",
    grades: { "Mathematics": "A", "Physics": "B+", "English": "A-" },
    violation_details: "Pending Class 12 Board Marksheet and Migration Certificate.",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const fetchLeads = async () => {
    try {
      const data = await api.getLeads({ limit: 100 });
      setLeads(data.items);
    } catch (err) {
      console.error("Failed to load leads", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      // Integrate signatory from settings custom params if present
      if (data && data.custom_params?.acceptance_letter_signature) {
        setVariables(prev => ({
          ...prev,
          signature: data.custom_params.acceptance_letter_signature
        }));
      } else {
        setVariables(prev => ({
          ...prev,
          signature: "Manav Singh, Operations Lead"
        }));
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await api.getDocuments();
      setDocLogs(data);
    } catch (err) {
      console.error("Failed to load document logs", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchSettings();
    fetchLogs();
  }, []);

  const handleLeadSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setLinkedLeadId(id);
    const lead = leads.find(l => l.id === id);
    if (lead) {
      setVariables(prev => ({
        ...prev,
        recipient_name: `${lead.first_name} ${lead.last_name}`,
        recipient_email: lead.email || "",
        academic_interest: lead.academic_interest || "",
      }));
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr.replace(" ", "T"));
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const compilePayloadVars = () => {
    const payloadVars: Record<string, any> = {
      recipient_name: variables.recipient_name,
      recipient_email: variables.recipient_email,
    };

    if (docType === "acceptance_letter") {
      payloadVars.academic_interest = variables.academic_interest;
      payloadVars.admission_date = variables.admission_date;
      payloadVars.signature = variables.signature;
    } else if (docType === "fee_receipt") {
      payloadVars.amount = variables.amount;
      payloadVars.payment_method = variables.payment_method;
      payloadVars.details = variables.details;
    } else if (docType === "report_card") {
      payloadVars.academic_interest = variables.academic_interest;
      payloadVars.grades = variables.grades;
    } else if (docType === "compliance_notice") {
      payloadVars.violation_details = variables.violation_details;
      payloadVars.due_date = variables.due_date;
    }
    return payloadVars;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payloadVars = compilePayloadVars();
      const blob = await api.generateDocumentPdf(docType, linkedLeadId || null, payloadVars);
      
      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `futureedge_${docType}_${Date.now().toString().slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Refresh audit logs
      fetchLogs();
    } catch (err) {
      alert("Failed to compile PDF document. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPreviewLoading(true);
    try {
      const payloadVars = compilePayloadVars();
      const blob = await api.generateDocumentPdf(docType, linkedLeadId || null, payloadVars);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (err) {
      alert("Failed to compile PDF preview. Check server logs.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleViewLog = async (log: any) => {
    setPreviewLoading(true);
    try {
      const blob = await api.getDocumentPdf(log.id);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch (err) {
      alert("Failed to load historical document PDF.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadLog = async (log: any) => {
    try {
      const blob = await api.getDocumentPdf(log.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `futureedge_${log.document_type}_${log.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download document PDF.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">Document Automation Suite</h2>
        <p className="text-xs text-slate-400 mt-1">Compile certified PDF letters, administrative receipts, and official compliance notices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Document variables form */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Compile Document Template" subtitle="Select a template and input variables">
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Document Type"
                  value={docType}
                  onChange={(e) => {
                    setDocType(e.target.value);
                  }}
                  options={[
                    { value: "acceptance_letter", label: "Acceptance Letter" },
                    { value: "fee_receipt", label: "Fee Receipt" },
                    { value: "report_card", label: "Student Report Card" },
                    { value: "compliance_notice", label: "Compliance Notice" },
                  ]}
                />
                
                <Select
                  label="Pre-fill from CRM (Optional)"
                  value={linkedLeadId}
                  onChange={handleLeadSelect}
                  options={[
                    { value: "", label: "Manual Entry" },
                    ...leads.map(l => ({ value: l.id, label: `${l.first_name} ${l.last_name}` }))
                  ]}
                />
              </div>

              {/* Shared Metadata fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <Input
                  label="Recipient Full Name"
                  value={variables.recipient_name}
                  onChange={(e) => setVariables(prev => ({ ...prev, recipient_name: e.target.value }))}
                  required
                />
                <Input
                  label="Recipient Email Address"
                  type="email"
                  value={variables.recipient_email}
                  onChange={(e) => setVariables(prev => ({ ...prev, recipient_email: e.target.value }))}
                />
              </div>

              {/* Acceptance Letter Fields */}
              {docType === "acceptance_letter" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Academic Program"
                    value={variables.academic_interest}
                    onChange={(e) => setVariables(prev => ({ ...prev, academic_interest: e.target.value }))}
                    required
                  />
                  <Input
                    label="Enrollment Commencement Date"
                    type="date"
                    value={variables.admission_date}
                    onChange={(e) => setVariables(prev => ({ ...prev, admission_date: e.target.value }))}
                    required
                  />
                  <Input
                    label="Authorized Signature Name"
                    value={variables.signature}
                    onChange={(e) => setVariables(prev => ({ ...prev, signature: e.target.value }))}
                    wrapperClassName="sm:col-span-2"
                    required
                  />
                </div>
              )}

              {/* Fee Receipt Fields */}
              {docType === "fee_receipt" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Payment Amount (₹)"
                    type="number"
                    step="0.01"
                    value={variables.amount}
                    onChange={(e) => setVariables(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                  <Input
                    label="Payment Channel"
                    value={variables.payment_method}
                    onChange={(e) => setVariables(prev => ({ ...prev, payment_method: e.target.value }))}
                    required
                  />
                  <Input
                    label="Invoice Details Description"
                    value={variables.details}
                    onChange={(e) => setVariables(prev => ({ ...prev, details: e.target.value }))}
                    wrapperClassName="sm:col-span-2"
                    required
                  />
                </div>
              )}

              {/* Report Card Fields */}
              {docType === "report_card" && (
                <div className="space-y-4">
                  <Input
                    label="Enrollment Program / Grade"
                    value={variables.academic_interest}
                    onChange={(e) => setVariables(prev => ({ ...prev, academic_interest: e.target.value }))}
                    required
                  />
                  
                  {/* Subject Grade inputs */}
                  <div className="bg-darkbg-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Subject Grade Scores</span>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.keys(variables.grades).map((subject) => (
                        <div key={subject}>
                          <span className="text-xs text-slate-400 block mb-1">{subject}</span>
                          <Input
                            value={variables.grades[subject]}
                            onChange={(e) => {
                              const val = e.target.value;
                              setVariables(prev => ({
                                ...prev,
                                grades: { ...prev.grades, [subject]: val }
                              }));
                            }}
                            className="text-center font-bold"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Compliance Notice Fields */}
              {docType === "compliance_notice" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Due Date for Resolution"
                    type="date"
                    value={variables.due_date}
                    onChange={(e) => setVariables(prev => ({ ...prev, due_date: e.target.value }))}
                    required
                  />
                  <Input
                    label="Compliance Breach Description"
                    value={variables.violation_details}
                    onChange={(e) => setVariables(prev => ({ ...prev, violation_details: e.target.value }))}
                    wrapperClassName="sm:col-span-2"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePreview} 
                  loading={previewLoading}
                  disabled={loading}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Document
                </Button>
                <Button type="submit" loading={loading} disabled={previewLoading}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate & Download PDF
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Audit Log column */}
        <div>
          <Card title="Certified Documents Logs" subtitle="Audit log of generated administrative files">
            {logsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                <span className="text-xs text-slate-500">Loading document logs...</span>
              </div>
            ) : docLogs.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                No documents logged yet. Compile a template to generate a record.
              </div>
            ) : (
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                {docLogs.map((log) => (
                  <div key={log.id} className="bg-darkbg-900/60 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-white truncate max-w-[140px]">{log.recipient_name}</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-darkbg-700 text-electric-400 truncate max-w-[100px]">
                        {log.document_type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
                      <span>Op: {log.generated_by}</span>
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-800/80 mt-2">
                      <button
                        onClick={() => handleViewLog(log)}
                        disabled={previewLoading}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button
                        onClick={() => handleDownloadLog(log)}
                        className="text-[10px] text-electric-400 hover:text-electric-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Document Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-darkbg-800 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white tracking-wider uppercase">Document Preview</h3>
              <button 
                onClick={() => {
                  window.URL.revokeObjectURL(previewUrl);
                  setPreviewUrl("");
                  setIsPreviewOpen(false);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 p-4 bg-darkbg-900/40 overflow-hidden">
              <iframe 
                src={previewUrl} 
                className="w-full h-[65vh] rounded-lg border border-slate-800/80 bg-white"
                title="PDF Preview"
              />
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <Button 
                variant="outline" 
                onClick={() => {
                  window.URL.revokeObjectURL(previewUrl);
                  setPreviewUrl("");
                  setIsPreviewOpen(false);
                }}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
