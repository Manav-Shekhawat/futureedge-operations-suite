import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import type { WhatsAppReport } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableRow, TableCell } from "../components/ui/Table";
import { 
  Upload, 
  FileText, 
  AlertTriangle, 
  Loader2, 
  User, 
  Smile, 
  Frown, 
  Calendar,
  Layers
} from "lucide-react";

export const MorningReport: React.FC = () => {
  const [reports, setReports] = useState<WhatsAppReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WhatsAppReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string>("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
      if (selectedReport) {
        const updated = data.find(r => r.id === selectedReport.id);
        if (updated) setSelectedReport(updated);
      }
    } catch (err) {
      console.error("Failed to load reports log", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const fetchStatus = async () => {
      try {
        const data = await api.getAiStatus();
        setAiStatus(data.status);
      } catch (err) {
        setAiStatus("Fallback Mode");
      }
    };
    fetchStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.name.endsWith(".txt")) {
        setFile(selected);
        setUploadError(null);
      } else {
        setFile(null);
        setUploadError("Please select a plain text (.txt) file.");
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await api.uploadReport(file);
      setFile(null);
      setSelectedReport(uploaded);
      fetchReports();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return <Smile className="w-4 h-4 text-emerald-400" />;
      case "concerned":
      case "urgent":
        return <Frown className="w-4 h-4 text-accent-danger animate-pulse" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (s: string) => {
    const badges: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
      processing: "bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse",
      completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
      failed: "bg-red-500/10 text-accent-danger border border-red-500/30"
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${badges[s] || ""}`}>
        {s}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Intelligent Morning Review</h2>
          <p className="text-xs text-slate-400 mt-1">Audit WhatsApp chat logs to discover at-risk parent updates and extract actions</p>
        </div>
        <div className="flex items-center gap-2 bg-darkbg-800 border border-slate-700/80 rounded-xl px-4 py-2 self-start sm:self-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Status</span>
          <span className={`h-2 w-2 rounded-full ${aiStatus === "Connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
          <span className="text-xs font-bold text-slate-300">{aiStatus || "Loading..."}</span>
        </div>
      </div>

      {/* Main Grid: Upload and History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Upload Form and List */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Panel */}
          <Card title="Upload WhatsApp Export Transcript" subtitle="Drag or browse plain text (.txt) exports from parent chats">
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700/80 hover:border-electric-500/60 rounded-xl p-8 text-center transition-all bg-darkbg-900/40 relative">
                <input 
                  type="file" 
                  accept=".txt" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-electric-500/10 border border-electric-500/20 flex items-center justify-center text-electric-500 mb-2">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </div>
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-300">Click or drag a WhatsApp chat file (.txt) here</p>
                      <p className="text-xs text-slate-500">Must be a plain text chat log file</p>
                    </div>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-accent-danger">
                  {uploadError}
                </div>
              )}

              {file && (
                <div className="flex justify-end">
                  <Button type="submit" loading={uploading}>
                    Begin Intelligent Analysis
                  </Button>
                </div>
              )}
            </form>
          </Card>

          {/* History table */}
          <Card title="Report Analysis History" subtitle="List of audited chats and compliance results" className="p-0">
            {loading && reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-electric-500" />
                <span className="text-xs text-slate-500">Loading history log...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No logs uploaded yet. Upload a WhatsApp transcript above to start.
              </div>
            ) : (
              <Table headers={["File Name", "Size", "Uploaded At", "Status"]}>
                {reports.map((rep) => (
                  <TableRow 
                    key={rep.id}
                    className={`cursor-pointer ${selectedReport?.id === rep.id ? "bg-darkbg-700/60" : ""}`}
                    onClick={() => setSelectedReport(rep)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-200">{rep.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {formatFileSize(rep.file_size)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {new Date(rep.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(rep.status)}</TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </Card>
        </div>

        {/* Selected Audit details sidebar */}
        <div>
          {selectedReport ? (
            <Card className="space-y-6 sticky top-8">
              {/* Report Header */}
              <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-white max-w-[180px] truncate">{selectedReport.file_name}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Audited: {new Date(selectedReport.created_at).toLocaleDateString()}</p>
                </div>
                {getStatusBadge(selectedReport.status)}
              </div>

              {selectedReport.status === "processing" ? (
                <div className="text-center py-20 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-electric-500" />
                  <p className="text-xs text-slate-400">Gemini is auditing conversations for risks and follow-ups. Please hold...</p>
                </div>
              ) : selectedReport.status === "failed" ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-xs text-accent-danger leading-relaxed">
                  <AlertTriangle className="w-5 h-5 mb-2" />
                  {selectedReport.summary}
                </div>
              ) : (
                <>
                  {/* Summary Block */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">AI Conversation Summary</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-darkbg-900/60 p-3 rounded-lg border border-slate-800/80">
                      {selectedReport.summary}
                    </p>
                  </div>

                  {/* Sentiment Bar */}
                  <div className="flex items-center justify-between bg-darkbg-900/40 p-3 rounded-lg border border-slate-800/50">
                    <span className="text-xs text-slate-400">Overall Sentiment</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200 capitalize">
                      {getSentimentIcon(selectedReport.analysis_results?.sentiment_overall)}
                      {selectedReport.analysis_results?.sentiment_overall || "neutral"}
                    </span>
                  </div>

                  {/* Flagged Parents / Students */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">At-Risk Parents Flags</span>
                    {selectedReport.analysis_results?.at_risk_students && selectedReport.analysis_results.at_risk_students.length > 0 ? (
                      <div className="space-y-2">
                        {selectedReport.analysis_results.at_risk_students.map((stud, idx) => (
                          <div key={idx} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-accent-danger" />
                                {stud.name}
                              </span>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-accent-danger tracking-wider">
                                {stud.urgency_level}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{stud.reason}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 bg-darkbg-900/40 p-3 rounded-lg border border-slate-800/50 text-center">
                        No at-risk concerns flagged in this log.
                      </div>
                    )}
                  </div>

                  {/* Extracted Action Tasks */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Follow-Up Action Items</span>
                    {selectedReport.analysis_results?.action_items && selectedReport.analysis_results.action_items.length > 0 ? (
                      <div className="space-y-2">
                        {selectedReport.analysis_results.action_items.map((act, idx) => (
                          <div key={idx} className="bg-darkbg-900/60 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                            <p className="text-slate-200 leading-normal font-medium">{act.task}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span className="capitalize">Assignee: {act.assignee_role}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-600" />
                                {act.due_date_estimation}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 bg-darkbg-900/40 p-3 rounded-lg border border-slate-800/50 text-center">
                        No clear actions identified.
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500 text-sm py-28 space-y-3">
              <FileText className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
              <p>Select an upload record from the list to review detailed AI audit summaries, flagging details, and action tasks.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
