import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Percent, 
  Activity, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { AnalyticsData, User } from '../types.js';

interface AnalyticsViewProps {
  token: string;
}

export default function AnalyticsView({ token }: AnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (!data) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center p-8 text-zinc-400">
        <Activity className="w-10 h-10 mx-auto mb-3 opacity-60 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium">Assembling business support records...</p>
      </div>
    );
  }

  const { summary, categoryDistribution, priorityDistribution, statusDistribution, trendData } = data;

  // Colors mapping for charts
  const priorityColors: Record<string, string> = {
    'Low': '#71717a',      // gray-500
    'Medium': '#f59e0b',   // amber-500
    'High': '#f97316',     // orange-500
    'Critical': '#f43f5e'  // rose-500
  };

  const statusColors: Record<string, string> = {
    'Open': '#3b82f6',     // blue-500
    'Assigned': '#6366f1', // indigo-500
    'Resolved': '#10b981', // emerald-500
    'Closed': '#0ea5e9'    // sky-500
  };

  // Compute maximums for bar heights
  const maxCategoryValue = Math.max(...categoryDistribution.map(c => c.value), 1);
  const maxStatusValue = Math.max(...statusDistribution.map(s => s.value), 1);
  const maxTrendValue = Math.max(...trendData.map(t => t.tickets), 1);

  // SVG Area Trend coordinates generator
  const getTrendSvgPoints = () => {
    const width = 500;
    const height = 150;
    const padding = 30;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const stepX = chartW / (trendData.length - 1);
    
    const points = trendData.map((t, idx) => {
      const x = padding + idx * stepX;
      const y = padding + chartH - (t.tickets / maxTrendValue) * chartH;
      return { x, y };
    });

    const pathString = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaString = `${pathString} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { pathString, areaString, points, padding, chartH, height, width };
  };

  const trendSvg = getTrendSvgPoints();

  return (
    <div className="space-y-8 animate-fade-in" id="analytics-panel">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Support Business Intelligence
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Enterprise KPIs, resolution velocities, routing channels, and SLA compliance audits.
          </p>
        </div>
        <button
          id="analytics-reload-data-btn"
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 text-zinc-600 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:bg-zinc-50 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading && 'animate-spin'}`} />
          Reload Intelligence
        </button>
      </div>

      {/* Overview stats panels row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="analytics-summary-cards">
        {/* SLA Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">SLA Resolution Rate</span>
            <Percent className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-end justify-between mt-4">
            <div>
              <h2 className="text-4xl font-extrabold text-zinc-950 tracking-tight">{summary.resolutionRate}%</h2>
              <p className="text-[10px] font-semibold text-emerald-600 mt-1 uppercase tracking-wide">Within standard target</p>
            </div>
            {/* Semicircular SLA Gauge */}
            <svg className="w-16 h-10 overflow-visible" viewBox="0 0 100 50">
              <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="#f4f4f5" strokeWidth="12" strokeLinecap="round" />
              <path 
                d="M 10,50 A 40,40 0 0,1 90,50" 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="12" 
                strokeLinecap="round"
                strokeDasharray="126"
                strokeDashoffset={126 - (126 * summary.resolutionRate) / 100} 
              />
            </svg>
          </div>
        </div>

        {/* Total tickets card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Filed Volume</span>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-extrabold text-zinc-950 tracking-tight">{summary.totalTickets}</h2>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">All channels history</p>
          </div>
        </div>

        {/* Dynamic Chats Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">AI Chats Resolved</span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-extrabold text-zinc-950 tracking-tight">{summary.totalChats}</h2>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">With AI automated categorization</p>
          </div>
        </div>

        {/* Today tickets card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">New Tickets Today</span>
            <BarChart3 className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-4">
            <h2 className="text-4xl font-extrabold text-zinc-950 tracking-tight">{summary.todayTickets}</h2>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase font-bold tracking-wider">Raised last 24h</p>
          </div>
        </div>
      </div>

      {/* Charts Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="analytics-charts-grid">
        {/* 1. Area Trend Chart: 7-Day tickets */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col h-full min-h-[350px]">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <h3 className="text-sm font-bold text-zinc-800">Support Load Volume (Last 7 Days)</h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">DYNAMIC</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-2 relative">
            <svg viewBox={`0 0 ${trendSvg.width} ${trendSvg.height}`} className="w-full h-full max-h-[220px]">
              {/* Grid Lines */}
              <line x1={trendSvg.padding} y1={trendSvg.padding} x2={trendSvg.width - trendSvg.padding} y2={trendSvg.padding} stroke="#f4f4f5" strokeWidth="1" />
              <line x1={trendSvg.padding} y1={trendSvg.padding + trendSvg.chartH / 2} x2={trendSvg.width - trendSvg.padding} y2={trendSvg.padding + trendSvg.chartH / 2} stroke="#f4f4f5" strokeWidth="1" />
              <line x1={trendSvg.padding} y1={trendSvg.height - trendSvg.padding} x2={trendSvg.width - trendSvg.padding} y2={trendSvg.height - trendSvg.padding} stroke="#e4e4e7" strokeWidth="1" />
              
              {/* Gradient Shading Fill */}
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={trendSvg.areaString} fill="url(#trendGrad)" />

              {/* Trend line */}
              <path d={trendSvg.pathString} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />

              {/* Trend node points */}
              {trendSvg.points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" className="transition-all group-hover:r-7" />
                  <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[9px] font-bold fill-zinc-700 hidden group-hover:block bg-zinc-950 text-white rounded">
                    {trendData[idx].tickets}
                  </text>
                </g>
              ))}

              {/* Axis Labels */}
              {trendSvg.points.map((p, idx) => (
                <text key={`label-${idx}`} x={p.x} y={trendSvg.height - 10} textAnchor="middle" className="text-[9px] font-bold fill-zinc-400">
                  {trendData[idx].day}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* 2. Horizontal Category bar chart */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col h-full min-h-[350px]">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-sm font-bold text-zinc-800">Frequency distribution by Category</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 pt-4">
            {categoryDistribution.map((cat) => {
              const percentage = Math.round((cat.value / maxCategoryValue) * 100);
              return (
                <div key={cat.name} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-zinc-600 font-medium">
                    <span>{cat.name}</span>
                    <strong className="text-zinc-900 font-bold">{cat.value} files</strong>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden w-full">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage || 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Donut-like Urgency priority breakdown */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col min-h-[320px]">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-sm font-bold text-zinc-800">Support Priority Breakdown</h3>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6 pt-6">
            {/* Multi segment stacked indicator */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f4f4f5" strokeWidth="4.5" />
                {(() => {
                  let cum = 0;
                  const total = priorityDistribution.reduce((acc, curr) => acc + curr.value, 0) || 1;
                  return priorityDistribution.map((pri, idx) => {
                    const share = (pri.value / total) * 100;
                    const strokeDash = `${share} ${100 - share}`;
                    const strokeOffset = 100 - cum;
                    cum += share;
                    return (
                      <circle 
                        key={pri.name}
                        cx="21" 
                        cy="21" 
                        r="15.915" 
                        fill="transparent" 
                        stroke={priorityColors[pri.name]} 
                        strokeWidth="4.5" 
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute text-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Classified</p>
                <p className="text-sm font-extrabold text-zinc-900 mt-0.5">{priorityDistribution.reduce((acc, curr) => acc + curr.value, 0)} Files</p>
              </div>
            </div>

            {/* Legends list */}
            <div className="space-y-2 w-full sm:w-auto shrink-0 min-w-[140px]">
              {priorityDistribution.map((pri) => {
                const total = priorityDistribution.reduce((acc, curr) => acc + curr.value, 0) || 1;
                return (
                  <div key={pri.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-zinc-500">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: priorityColors[pri.name] }} />
                      {pri.name}
                    </span>
                    <strong className="text-zinc-800 font-bold">
                      {pri.value} ({Math.round((pri.value / total) * 100)}%)
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Column Bar Chart for ticket status */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col min-h-[320px]">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-sm font-bold text-zinc-800">Active Workflow Status Stages</h3>
          </div>
          <div className="flex-1 flex flex-col justify-between pt-6 space-y-6">
            <div className="flex items-end justify-around h-36 border-b border-zinc-100 pb-2 px-4" id="status-bar-chart-container">
              {statusDistribution.map((st) => {
                const percentage = (st.value / maxStatusValue) * 100;
                return (
                  <div key={st.name} className="flex flex-col items-center gap-2 group w-12 cursor-pointer">
                    <div className="relative w-full flex justify-center">
                      <span className="absolute -top-7 text-[10px] font-bold text-zinc-700 bg-zinc-100 px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {st.value} files
                      </span>
                      <div 
                        className="w-8 rounded-t-md transition-all duration-500" 
                        style={{ 
                          height: `${percentage ? (percentage * 1.1) : 4}px`, // Add scale buffer
                          backgroundColor: statusColors[st.name],
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400">{st.name}</span>
                  </div>
                );
              })}
            </div>
            {/* Column cards for values */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs p-1">
              {statusDistribution.map(st => (
                <div key={st.name} className="space-y-0.5">
                  <span className="text-zinc-400 text-[10px] font-bold uppercase">{st.name}</span>
                  <p className="font-extrabold text-zinc-800 text-sm">{st.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
