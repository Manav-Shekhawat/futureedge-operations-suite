import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import type { LeadActivity } from "../types";
import { 
  FileText, 
  Phone, 
  Mail, 
  RefreshCw, 
  AlertTriangle, 
  PlusCircle, 
  MessageSquare
} from "lucide-react";

interface TimelineProps {
  leadId: string;
  refreshTrigger: number;
}

export const LeadActivityTimeline: React.FC<TimelineProps> = ({ leadId, refreshTrigger }) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await api.getLeadActivities(leadId);
        setActivities(data);
      } catch (err) {
        console.error("Failed to load activities", err);
      } finally {
        setLoading(false);
      }
    };
    if (leadId) fetchActivities();
  }, [leadId, refreshTrigger]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "note":
        return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case "call":
        return <Phone className="w-4 h-4 text-sky-400" />;
      case "email":
        return <Mail className="w-4 h-4 text-indigo-400" />;
      case "whatsapp_sync":
        return <MessageSquare className="w-4 h-4 text-green-400" />;
      case "status_change":
        return <RefreshCw className="w-4 h-4 text-amber-400" />;
      case "ai_summary":
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case "document_generated":
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-electric-500" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 text-xs">
        No recent activities logged for this lead.
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-6 py-2">
      {activities.map((act) => (
        <div key={act.id} className="relative">
          {/* Icon Badge */}
          <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-darkbg-800 border border-slate-700/80 flex items-center justify-center shadow-md">
            {getActivityIcon(act.activity_type)}
          </div>
          
          {/* Content */}
          <div>
            <div className="flex justify-between items-start gap-4">
              <h4 className="text-xs font-semibold text-slate-200 capitalize">
                {act.activity_type.replace("_", " ")}
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                {formatDate(act.created_at)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{act.description}</p>
            
            {/* Metadata Preview */}
            {act.metadata && Object.keys(act.metadata).length > 0 && (
              <div className="bg-darkbg-900/60 rounded px-2.5 py-1.5 border border-slate-800/80 text-[10px] text-slate-500 font-mono mt-2 flex flex-wrap gap-2">
                {Object.entries(act.metadata).map(([key, val]) => (
                  <span key={key}>
                    <span className="text-slate-600 font-semibold">{key}:</span> {String(val)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
