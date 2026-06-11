import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Lead } from "../types";
import { Card } from "../components/ui/Card";
import { 
  Users, 
  AlertTriangle, 
  UserCheck, 
  Percent, 
  Sparkles,
  TrendingUp
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export const Dashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    atRisk: 0,
    admitted: 0,
    conversion: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const data = await api.getLeads({ limit: 1000 }); // load all leads for stats
        setLeads(data.items);
        
        const total = data.total;
        const atRisk = data.items.filter(l => l.is_at_risk).length;
        const admitted = data.items.filter(l => l.status === "admitted").length;
        const lost = data.items.filter(l => l.status === "lost").length;
        const conversion = total > 0 ? Math.round((admitted / (total - lost || 1)) * 100) : 0;

        setStats({
          total,
          atRisk,
          admitted,
          conversion
        });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Prepare chart data: Status Distribution
  const statusCounts = leads.reduce((acc: Record<string, number>, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.toUpperCase().replace("_", " "),
    count
  }));

  // Prepare chart data: Lead Sources
  const sourceCounts = leads.reduce((acc: Record<string, number>, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {});

  const sourceChartData = Object.entries(sourceCounts).map(([source, count]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count
  }));

  const COLORS = ["#008DDA", "#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500" />
        <p className="text-xs text-slate-500">Compiling operations statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">Operations Command Center</h2>
        <p className="text-xs text-slate-400 mt-1">Real-time indicators, CRM metrics, and AI compliance summaries</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Leads</span>
            <div className="text-2xl font-extrabold text-white">{stats.total}</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +12% vs last month
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">At-Risk Alerts</span>
            <div className={`text-2xl font-extrabold ${stats.atRisk > 0 ? "text-accent-danger" : "text-white"}`}>
              {stats.atRisk}
            </div>
            <div className={`text-[10px] flex items-center gap-0.5 ${stats.atRisk > 0 ? "text-accent-danger" : "text-slate-500"}`}>
              {stats.atRisk > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : null}
              {stats.atRisk > 0 ? "Requires active outreach" : "All clear"}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.atRisk > 0 ? "bg-red-500/10 border border-red-500/20" : "bg-darkbg-700"}`}>
            <AlertTriangle className={`w-5 h-5 ${stats.atRisk > 0 ? "text-accent-danger" : "text-slate-500"}`} />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admitted Students</span>
            <div className="text-2xl font-extrabold text-white">{stats.admitted}</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              +5 new this week
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Conversion Ratio</span>
            <div className="text-2xl font-extrabold text-white">{stats.conversion}%</div>
            <div className="text-[10px] text-indigo-400 flex items-center gap-0.5">
              <Percent className="w-3.5 h-3.5" />
              Net admitted vs lost
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-electric-500/10 border border-electric-500/20 flex items-center justify-center">
            <Percent className="w-5 h-5 text-electric-500" />
          </div>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card title="Candidate Pipeline Distribution" subtitle="Active candidates across the enrollment funnel" className="lg:col-span-2">
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0B1220", borderColor: "#334155", color: "#F8FAFC" }}
                  cursor={{ fill: "rgba(30, 41, 59, 0.4)" }}
                />
                <Bar dataKey="count" fill="#008DDA" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Lead Sources Pie */}
        <Card title="Lead Acquisition Channels" subtitle="Enrollment inquiries sorted by initial source">
          <div className="h-80 w-full flex flex-col items-center justify-center text-xs">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={sourceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sourceChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0B1220", borderColor: "#334155", color: "#F8FAFC" }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2 px-4">
              {sourceChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Operational guidelines / Quick actions info */}
      <Card title="AI Operations Guidance" subtitle="Insights and automated action points from the system">
        <div className="flex gap-4 items-start p-4 bg-electric-500/5 border border-electric-500/10 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-electric-500/15 flex items-center justify-center text-electric-500 flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-white leading-none">Intelligent Morning Review Ready</h4>
            <p className="text-slate-400 leading-relaxed">
              Upload parent WhatsApp conversation transcripts in the **Morning Report** section to automatically audit communications, extract complaints, and sync actions directly into the CRM.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
